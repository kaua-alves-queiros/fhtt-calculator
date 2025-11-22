
import { calculateNetworkSignals } from '../lib/fhtt/calculation';
import { FHTTNodeData, FHTTEdgeData } from '../lib/fhtt/types';
import { Node, Edge } from '@xyflow/react';

const runTest = () => {
    console.log('Running Signal Calculation Verification...');

    // Test Case 1: Simple Balanced
    const nodes1: Node<FHTTNodeData>[] = [
        { id: 'olt', type: 'OLT', position: { x: 0, y: 0 }, data: { label: 'OLT', type: 'OLT', power: 3 } },
        { id: 'split', type: 'SPLITTER_BALANCED', position: { x: 100, y: 0 }, data: { label: 'Splitter', type: 'SPLITTER_BALANCED', loss: 3.5 } },
        { id: 'onu', type: 'ONU', position: { x: 200, y: 0 }, data: { label: 'ONU', type: 'ONU' } },
    ];

    const edges1: Edge<FHTTEdgeData>[] = [
        { id: 'e1', source: 'olt', target: 'split', sourceHandle: 'out', data: { length: 1000, lossPerKm: 0.35 } },
        { id: 'e2', source: 'split', target: 'onu', sourceHandle: 'out', data: { length: 0, lossPerKm: 0.35 } },
    ];

    const result1 = calculateNetworkSignals(nodes1, edges1);
    const onu1 = result1.find(n => n.id === 'onu');

    console.log('Test Case 1 (OLT -> 1km -> Splitter 1:2 -> ONU):');
    console.log('Expected: 3 - 0.35 - 3.5 = -0.85');
    console.log('Actual:', onu1?.data.inputSignal);

    if (Math.abs((onu1?.data.inputSignal as number) - (-0.85)) < 0.001) {
        console.log('PASS');
    } else {
        console.error('FAIL');
    }

    // Test Case 2: Unbalanced
    const nodes2: Node<FHTTNodeData>[] = [
        { id: 'olt', type: 'OLT', position: { x: 0, y: 0 }, data: { label: 'OLT', type: 'OLT', power: 3 } },
        {
            id: 'split', type: 'SPLITTER_UNBALANCED', position: { x: 100, y: 0 }, data: {
                label: 'Splitter', type: 'SPLITTER_UNBALANCED',
                portLosses: { 'out-5': 14, 'out-95': 1 }
            }
        },
        { id: 'onuA', type: 'ONU', position: { x: 200, y: 0 }, data: { label: 'ONU A', type: 'ONU' } },
        { id: 'onuB', type: 'ONU', position: { x: 200, y: 100 }, data: { label: 'ONU B', type: 'ONU' } },
    ];

    const edges2: Edge<FHTTEdgeData>[] = [
        { id: 'e1', source: 'olt', target: 'split', sourceHandle: 'out', data: { length: 100, lossPerKm: 0.35 } }, // 0.035 loss
        { id: 'e2', source: 'split', target: 'onuA', sourceHandle: 'out-5', data: { length: 0, lossPerKm: 0.35 } },
        { id: 'e3', source: 'split', target: 'onuB', sourceHandle: 'out-95', data: { length: 0, lossPerKm: 0.35 } },
    ];

    const result2 = calculateNetworkSignals(nodes2, edges2);
    const onuA = result2.find(n => n.id === 'onuA');
    const onuB = result2.find(n => n.id === 'onuB');

    console.log('\nTest Case 2 (OLT -> 100m -> Splitter 5/95):');
    console.log('Input to Splitter: 3 - 0.035 = 2.965');
    console.log('ONU A (5% leg, -14dB): 2.965 - 14 = -11.035');
    console.log('Actual ONU A:', onuA?.data.inputSignal);
    console.log('ONU B (95% leg, -1dB): 2.965 - 1 = 1.965');
    console.log('Actual ONU B:', onuB?.data.inputSignal);

    if (Math.abs((onuA?.data.inputSignal as number) - (-11.035)) < 0.001 &&
        Math.abs((onuB?.data.inputSignal as number) - (1.965)) < 0.001) {
        console.log('PASS');
    } else {
        console.error('FAIL');
    }
};

runTest();
