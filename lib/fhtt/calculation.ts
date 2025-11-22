import { Edge, Node } from '@xyflow/react';
import { FHTTNodeData, FHTTEdgeData } from './types';

// Standard losses
const DEFAULT_FIBER_LOSS = 0.35;

export const calculateNetworkSignals = (
    nodes: Node<FHTTNodeData>[],
    edges: Edge<FHTTEdgeData>[]
): Node<FHTTNodeData>[] => {
    // Create a map for easier access
    const nodeMap = new Map(nodes.map((n) => [n.id, { ...n, data: { ...n.data } }]));
    const edgeMap = new Map<string, Edge<FHTTEdgeData>[]>(); // sourceId -> edges

    edges.forEach((edge) => {
        if (!edgeMap.has(edge.source)) {
            edgeMap.set(edge.source, []);
        }
        edgeMap.get(edge.source)?.push(edge);
    });

    // Find OLTs (roots)
    const queue: string[] = [];

    nodes.forEach((node) => {
        if (node.type === 'OLT') {
            // Initialize OLT output
            const power = node.data.power ?? 3; // Default +3 dBm
            nodeMap.get(node.id)!.data.inputSignal = null; // OLT has no input
            nodeMap.get(node.id)!.data.outputSignals = { 'out': power };
            queue.push(node.id);
        } else {
            // Reset others
            const n = nodeMap.get(node.id)!;
            n.data.inputSignal = null;
            n.data.outputSignals = {};
        }
    });

    // BFS / Propagation
    while (queue.length > 0) {
        const sourceId = queue.shift()!;
        const sourceNode = nodeMap.get(sourceId)!;
        const outgoingEdges = edgeMap.get(sourceId) || [];

        outgoingEdges.forEach((edge) => {
            const targetId = edge.target;
            const targetNode = nodeMap.get(targetId);
            if (!targetNode) return;

            // Calculate loss on edge
            const length = edge.data?.length ?? 0; // meters
            const lossPerKm = edge.data?.lossPerKm ?? DEFAULT_FIBER_LOSS;
            const cableLoss = (length / 1000) * lossPerKm;

            // Get source signal
            // The edge.sourceHandle tells us which port it came from
            // We now use edge.data.sourcePort for the logical port, defaulting to 'out'
            const sourceHandle = (edge.data?.sourcePort as string) || edge.sourceHandle || 'out';
            const sourceSignal = sourceNode.data.outputSignals?.[sourceHandle];

            if (sourceSignal !== undefined) {
                const inputAtTarget = sourceSignal - cableLoss;

                // Update target input
                targetNode.data.inputSignal = inputAtTarget;

                // Calculate target outputs based on component type
                const outputs = calculateNodeOutputs(targetNode);
                targetNode.data.outputSignals = outputs;

                // Add to queue to propagate further
                queue.push(targetId);
            }
        });
    }

    return Array.from(nodeMap.values());
};

const calculateNodeOutputs = (node: Node<FHTTNodeData>): Record<string, number> => {
    const input = node.data.inputSignal;
    if (input === undefined || input === null) return {};

    const outputs: Record<string, number> = {};

    switch (node.type) {
        case 'OLT':
            return node.data.outputSignals || {};

        case 'ATTENUATOR':
            const att = node.data.attenuation ?? 0;
            outputs['out'] = input - att;
            break;

        case 'SPLITTER_BALANCED':
            // e.g. 1:8
            const loss = node.data.loss ?? 3.5;
            const ratio = (node.data.ratio as string) || "1:2";
            const count = parseInt(ratio.split(':')[1] || "2");

            // Generate outputs for all ports
            for (let i = 1; i <= count; i++) {
                outputs[`out-${i}`] = input - loss;
            }
            // Also keep generic 'out' for backward compatibility
            outputs['out'] = input - loss;
            break;

        case 'SPLITTER_UNBALANCED':
            // e.g. 5/95
            const losses = node.data.portLosses || {};
            Object.entries(losses).forEach(([handle, lossVal]) => {
                outputs[handle] = input - lossVal;
            });
            break;

        case 'ONU':
            // No output
            break;
    }

    return outputs;
};
