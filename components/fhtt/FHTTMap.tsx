'use client';

import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    ReactFlowProvider,
    useReactFlow,
    Panel,
    MarkerType,
    NodeMouseHandler,
    EdgeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Sidebar } from './Sidebar';
import { OLTNode, SplitterNode, ONUNode, AttenuatorNode } from './nodes';
import { ConnectionDialog } from './ConnectionDialog';
import { EditNodeDialog } from './EditNodeDialog';
import { EditEdgeDialog } from './EditEdgeDialog';
import { ContextMenu } from './ContextMenu';
import { calculateNetworkSignals } from '@/lib/fhtt/calculation';
import { FHTTNodeData, FHTTEdgeData } from '@/lib/fhtt/types';
import { Link, MousePointer2, Download, Upload } from 'lucide-react';
import { clsx } from 'clsx';

const nodeTypes: any = {
    OLT: OLTNode,
    SPLITTER_BALANCED: SplitterNode,
    SPLITTER_UNBALANCED: SplitterNode,
    ATTENUATOR: AttenuatorNode,
    ONU: ONUNode,
};

const getId = () => `dndnode_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const FHTTMapContent = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState<Node<FHTTNodeData>>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<FHTTEdgeData>>([]);
    const { screenToFlowPosition } = useReactFlow();

    // Connection Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [pendingConnection, setPendingConnection] = useState<{ source: string; target: string } | null>(null);

    // Edit Dialogs State
    const [editNode, setEditNode] = useState<Node<FHTTNodeData> | null>(null);
    const [editEdge, setEditEdge] = useState<Edge<FHTTEdgeData> | null>(null);

    // Link Mode State
    const [isLinkMode, setIsLinkMode] = useState(false);
    const [linkSourceId, setLinkSourceId] = useState<string | null>(null);

    // Context Menu State
    const [menu, setMenu] = useState<{ id: string; type: 'node' | 'edge'; x: number; y: number } | null>(null);

    const [calcTrigger, setCalcTrigger] = useState(0);

    // Recalculate signals whenever topology or parameters change
    useEffect(() => {
        const updatedNodes = calculateNetworkSignals(nodes, edges);
        setNodes((nds) =>
            nds.map((n) => {
                const updated = updatedNodes.find((un) => un.id === n.id);
                if (updated && JSON.stringify(updated.data) !== JSON.stringify(n.data)) {
                    return { ...n, data: updated.data };
                }
                return n;
            })
        );
    }, [calcTrigger]);

    const onConnect = useCallback(
        (params: Connection) => {
            // Only allow connection via Link Mode logic
        },
        []
    );

    const onDialogConfirm = (sourceHandle: string, cableLength: number) => {
        if (pendingConnection) {
            // Constraint Check 1: Target node should have only 1 input
            const targetHasInput = edges.some(e => e.target === pendingConnection.target);
            if (targetHasInput) {
                alert("Target node already has an input connection!");
                setIsDialogOpen(false);
                setPendingConnection(null);
                setLinkSourceId(null);
                return;
            }

            // Constraint Check 2: Source port should have only 1 output
            const sourcePortHasOutput = edges.some(e =>
                e.source === pendingConnection.source &&
                (e.sourceHandle === sourceHandle || (!e.sourceHandle && sourceHandle === 'out'))
            );
            if (sourcePortHasOutput) {
                alert(`Source port '${sourceHandle}' is already connected!`);
                setIsDialogOpen(false);
                setPendingConnection(null);
                setLinkSourceId(null);
                return;
            }

            const newEdge: Edge<FHTTEdgeData> = {
                id: `e${pendingConnection.source}-${pendingConnection.target}-${Date.now()}`,
                source: pendingConnection.source,
                target: pendingConnection.target,
                sourceHandle: 'out', // Visual handle ID is always 'out' now
                data: {
                    length: cableLength,
                    lossPerKm: 0.35,
                    sourcePort: sourceHandle // Logical port (e.g., 'out-1')
                },
                label: `${cableLength}m`,
                type: 'straight', // Straight lines
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { strokeWidth: 2 },
            };
            setEdges((eds) => addEdge(newEdge, eds));
            setCalcTrigger(c => c + 1);
        }
        setIsDialogOpen(false);
        setPendingConnection(null);
        setLinkSourceId(null);
    };

    const onNodeEditConfirm = (nodeId: string, updates: Partial<FHTTNodeData>) => {
        setNodes((nds) => nds.map((n) => {
            if (n.id === nodeId) {
                return { ...n, data: { ...n.data, ...updates } };
            }
            return n;
        }));
        setEditNode(null);
        setCalcTrigger(c => c + 1);
    };

    const onEdgeEditConfirm = (edgeId: string, updates: Partial<FHTTEdgeData>) => {
        setEdges((eds) => eds.map((e) => {
            if (e.id === edgeId) {
                const currentData = e.data || { length: 0, lossPerKm: 0.35 };
                const newData: FHTTEdgeData = {
                    ...currentData,
                    ...updates,
                    length: updates.length ?? currentData.length,
                    lossPerKm: updates.lossPerKm ?? currentData.lossPerKm
                };

                return {
                    ...e,
                    data: newData,
                    label: `${newData.length}m`
                };
            }
            return e;
        }));
        setEditEdge(null);
        setCalcTrigger(c => c + 1);
    };

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow') as any;
            const label = event.dataTransfer.getData('application/fhtt-label');
            const dataStr = event.dataTransfer.getData('application/fhtt-data');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node<FHTTNodeData> = {
                id: getId(),
                type,
                position,
                data: {
                    label,
                    type,
                    ...(dataStr ? JSON.parse(dataStr) : {})
                },
            };

            setNodes((nds) => nds.concat(newNode));
            setCalcTrigger(c => c + 1);
        },
        [screenToFlowPosition, setNodes],
    );

    const onNodeClick = (event: React.MouseEvent, node: Node) => {
        setMenu(null); // Close menu if open
        if (isLinkMode) {
            if (!linkSourceId) {
                setLinkSourceId(node.id);
            } else {
                if (linkSourceId !== node.id) {
                    // Create connection
                    setPendingConnection({ source: linkSourceId, target: node.id });
                    setIsDialogOpen(true);
                }
            }
        }
    };

    const onNodeDoubleClick = (event: React.MouseEvent, node: Node) => {
        setEditNode(node as Node<FHTTNodeData>);
    };

    const onEdgeDoubleClick = (event: React.MouseEvent, edge: Edge) => {
        setEditEdge(edge as Edge<FHTTEdgeData>);
    };

    const onNodeContextMenu: NodeMouseHandler = useCallback(
        (event, node) => {
            event.preventDefault();
            setMenu({
                id: node.id,
                type: 'node',
                x: event.clientX,
                y: event.clientY,
            });
        },
        [],
    );

    const onEdgeContextMenu: EdgeMouseHandler = useCallback(
        (event, edge) => {
            event.preventDefault();
            setMenu({
                id: edge.id,
                type: 'edge',
                x: event.clientX,
                y: event.clientY,
            });
        },
        [],
    );

    const onDelete = useCallback(() => {
        if (!menu) return;
        if (menu.type === 'node') {
            setNodes((nds) => nds.filter((n) => n.id !== menu.id));
            setEdges((eds) => eds.filter((e) => e.source !== menu.id && e.target !== menu.id));
        } else if (menu.type === 'edge') {
            setEdges((eds) => eds.filter((e) => e.id !== menu.id));
        }
        setMenu(null);
        setCalcTrigger(c => c + 1);
    }, [menu, setNodes, setEdges]);

    const sourceNode = useMemo(() => nodes.find(n => n.id === pendingConnection?.source) || null, [nodes, pendingConnection]);
    const targetNode = useMemo(() => nodes.find(n => n.id === pendingConnection?.target) || null, [nodes, pendingConnection]);

    const onExport = () => {
        const data = {
            nodes,
            edges,
        };
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'fhtt-network.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const onImportClick = () => {
        fileInputRef.current?.click();
    };

    const onImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);
                if (data.nodes && data.edges) {
                    setNodes(data.nodes);
                    setEdges(data.edges);
                    setCalcTrigger(c => c + 1);
                    alert('Network loaded successfully!');
                } else {
                    alert('Invalid file format: Missing nodes or edges.');
                }
            } catch (error) {
                console.error('Error parsing JSON:', error);
                alert('Error loading file. Please ensure it is a valid JSON file.');
            }
        };
        reader.readAsText(file);
        // Reset input so same file can be selected again
        event.target.value = '';
    };

    return (
        <div className="flex h-screen w-full">
            <Sidebar />
            <div className="flex-grow h-full relative" ref={reactFlowWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onNodeClick={onNodeClick}
                    onNodeDoubleClick={onNodeDoubleClick}
                    onEdgeDoubleClick={onEdgeDoubleClick}
                    onNodeContextMenu={onNodeContextMenu}
                    onEdgeContextMenu={onEdgeContextMenu}
                    onNodesDelete={() => setCalcTrigger(c => c + 1)}
                    onEdgesDelete={() => setCalcTrigger(c => c + 1)}
                    nodeTypes={nodeTypes}
                    nodesConnectable={false} // Disable drag to connect
                    defaultEdgeOptions={{ type: 'straight' }} // Straight lines
                    fitView
                >
                    <Controls />
                    <Background gap={12} size={1} />

                    <Panel position="top-center" className="bg-white p-2 rounded shadow-md flex gap-2">
                        <button
                            className={clsx(
                                "px-3 py-1 rounded flex items-center gap-2",
                                !isLinkMode ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
                            )}
                            onClick={() => { setIsLinkMode(false); setLinkSourceId(null); }}
                        >
                            <MousePointer2 size={16} />
                            Select
                        </button>
                        <button
                            className={clsx(
                                "px-3 py-1 rounded flex items-center gap-2",
                                isLinkMode ? "bg-blue-600 text-white" : "hover:bg-gray-100"
                            )}
                            onClick={() => setIsLinkMode(true)}
                        >
                            <Link size={16} />
                            Link Mode {isLinkMode && linkSourceId && "(Select Target)"}
                        </button>
                        <div className="w-px bg-gray-300 mx-1" />
                        <button
                            className="px-3 py-1 rounded flex items-center gap-2 hover:bg-gray-100 text-gray-700"
                            onClick={onExport}
                            title="Export to JSON"
                        >
                            <Download size={16} />
                            Export
                        </button>
                        <button
                            className="px-3 py-1 rounded flex items-center gap-2 hover:bg-gray-100 text-gray-700"
                            onClick={onImportClick}
                            title="Import from JSON"
                        >
                            <Upload size={16} />
                            Import
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={onImportFile}
                            accept=".json"
                            className="hidden"
                        />
                    </Panel>

                    {menu && (
                        <ContextMenu
                            x={menu.x}
                            y={menu.y}
                            onDelete={onDelete}
                            onClose={() => setMenu(null)}
                        />
                    )}
                </ReactFlow>

                <ConnectionDialog
                    isOpen={isDialogOpen}
                    onClose={() => { setIsDialogOpen(false); setPendingConnection(null); setLinkSourceId(null); }}
                    onConfirm={onDialogConfirm}
                    sourceNode={sourceNode}
                    targetNode={targetNode}
                />

                <EditNodeDialog
                    isOpen={!!editNode}
                    onClose={() => setEditNode(null)}
                    onConfirm={onNodeEditConfirm}
                    node={editNode}
                />

                <EditEdgeDialog
                    isOpen={!!editEdge}
                    onClose={() => setEditEdge(null)}
                    onConfirm={onEdgeEditConfirm}
                    edge={editEdge}
                />
            </div>
        </div>
    );
};

export default function FHTTMap() {
    return (
        <ReactFlowProvider>
            <FHTTMapContent />
        </ReactFlowProvider>
    );
}
