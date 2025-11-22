import React, { useState, useEffect } from 'react';
import { FHTTNodeData } from '@/lib/fhtt/types';
import { Node } from '@xyflow/react';

interface ConnectionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (sourceHandle: string, cableLength: number) => void;
    sourceNode: Node<FHTTNodeData> | null;
    targetNode: Node<FHTTNodeData> | null;
}

export const ConnectionDialog = ({ isOpen, onClose, onConfirm, sourceNode, targetNode }: ConnectionDialogProps) => {
    const [selectedPort, setSelectedPort] = useState<string>('out');
    const [cableLength, setCableLength] = useState<number>(100); // meters

    useEffect(() => {
        if (isOpen && sourceNode) {
            // Reset defaults
            setCableLength(100);

            // Default port logic
            if (sourceNode.data.type === 'SPLITTER_UNBALANCED') {
                const ports = Object.keys(sourceNode.data.portLosses || {});
                if (ports.length > 0) setSelectedPort(ports[0]);
            } else if (sourceNode.data.type === 'SPLITTER_BALANCED') {
                setSelectedPort('out-1');
            } else {
                setSelectedPort('out');
            }
        }
    }, [isOpen, sourceNode]);

    if (!isOpen || !sourceNode || !targetNode) return null;

    const isUnbalanced = sourceNode.data.type === 'SPLITTER_UNBALANCED';
    const isBalanced = sourceNode.data.type === 'SPLITTER_BALANCED';

    let ports: string[] = ['out'];
    if (isUnbalanced) {
        ports = Object.keys(sourceNode.data.portLosses || {});
    } else if (isBalanced) {
        const ratio = (sourceNode.data.ratio as string) || "1:2";
        const count = parseInt(ratio.split(':')[1] || "2");
        ports = Array.from({ length: count }, (_, i) => `out-${i + 1}`);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-full text-gray-900">
                <h2 className="text-lg font-bold mb-4 text-gray-900">Connect Nodes</h2>

                <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">From:</div>
                    <div className="font-medium text-gray-900">{sourceNode.data.label}</div>
                </div>

                <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">To:</div>
                    <div className="font-medium text-gray-900">{targetNode.data.label}</div>
                </div>

                {(isUnbalanced || isBalanced) && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Output Port</label>
                        <select
                            value={selectedPort}
                            onChange={(e) => setSelectedPort(e.target.value)}
                            className="w-full border border-gray-300 rounded-md p-2 text-gray-900 bg-white"
                        >
                            {ports.map(port => (
                                <option key={port} value={port}>
                                    {port} {isUnbalanced ? `(-${sourceNode.data.portLosses?.[port]} dB)` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cable Length (meters)</label>
                    <input
                        type="number"
                        value={cableLength}
                        onChange={(e) => setCableLength(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-md p-2 text-gray-900"
                        min="0"
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(selectedPort, cableLength)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Connect
                    </button>
                </div>
            </div>
        </div>
    );
};
