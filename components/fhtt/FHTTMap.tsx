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
import { ContextMenu } from './ContextMenu';
import { calculateNetworkSignals } from '@/lib/fhtt/calculation';
import { FHTTNodeData, FHTTEdgeData } from '@/lib/fhtt/types';
import { Link, MousePointer2 } from 'lucide-react';
import { clsx } from 'clsx';

const nodeTypes: any = {
    OLT: OLTNode,
    SPLITTER_BALANCED: SplitterNode,
    SPLITTER_UNBALANCED: SplitterNode,
    ATTENUATOR: AttenuatorNode,
    ONU: ONUNode,
};

let id = 0;
const getId = () => `dndnode_${id++}`;

const FHTTMapContent = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState<Node<FHTTNodeData>>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<FHTTEdgeData>>([]);
    const { screenToFlowPosition } = useReactFlow();

    // Connection Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [pendingConnection, setPendingConnection] = useState<{ source: string; target: string } | null>(null);

    // Link Mode State
    const [isLinkMode, setIsLinkMode] = useState(false);
    const [linkSourceId, setLinkSourceId] = useState<string | null>(null);

    // Context Menu State
    const [menu, setMenu] = useState<{ id: string; type: 'node' | 'edge'; x: number; y: number } | null>(null);

    // Recalculate signals whenever topology changes
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
    }, [edges.length, nodes.length]);

    const onConnect = useCallback(
        (params: Connection) => {
            // Only allow connection via Link Mode logic, not drag-and-drop
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
                sourceHandle: 'out', // Visual handle ID
                data: {
                    length: cableLength,
                    lossPerKm: 0.35,
                    sourcePort: sourceHandle // Logical port
                },
                label: `${cableLength}m`,
                type: 'straight', // Straight lines
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { strokeWidth: 2 },
            };
            setEdges((eds) => addEdge(newEdge, eds));
        }
        setIsDialogOpen(false);
        setPendingConnection(null);
        setLinkSourceId(null);
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
    }, [menu, setNodes, setEdges]);

    const sourceNode = useMemo(() => nodes.find(n => n.id === pendingConnection?.source) || null, [nodes, pendingConnection]);
    const targetNode = useMemo(() => nodes.find(n => n.id === pendingConnection?.target) || null, [nodes, pendingConnection]);

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
                    onNodeContextMenu={onNodeContextMenu}
                    onEdgeContextMenu={onEdgeContextMenu}
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
