import React, { useState, useEffect } from 'react';
import { FHTTNodeData } from '@/lib/fhtt/types';
import { Node } from '@xyflow/react';

interface EditNodeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (nodeId: string, updates: Partial<FHTTNodeData>) => void;
    node: Node<FHTTNodeData> | null;
}

export const EditNodeDialog = ({ isOpen, onClose, onConfirm, node }: EditNodeDialogProps) => {
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [power, setPower] = useState(3);
    const [attenuation, setAttenuation] = useState(0);

    useEffect(() => {
        if (isOpen && node) {
            setLabel(node.data.label || '');
            setDescription(node.data.description || '');
            setPower(node.data.power ?? 3);
            setAttenuation(node.data.attenuation ?? 0);
        }
    }, [isOpen, node]);

    if (!isOpen || !node) return null;

    const isOLT = node.data.type === 'OLT';
    const isAttenuator = node.data.type === 'ATTENUATOR';

    const handleConfirm = () => {
        const updates: Partial<FHTTNodeData> = {
            label,
            description,
        };

        if (isOLT) {
            updates.power = power;
        }

        if (isAttenuator) {
            updates.attenuation = attenuation;
        }

        onConfirm(node.id, updates);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-full text-gray-900">
                <h2 className="text-lg font-bold mb-4 text-gray-900">Edit Node</h2>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-2 text-gray-900"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-2 text-gray-900"
                        rows={3}
                    />
                </div>

                {isOLT && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Power (dBm)</label>
                        <input
                            type="number"
                            value={power}
                            onChange={(e) => setPower(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-md p-2 text-gray-900"
                            step="0.1"
                        />
                    </div>
                )}

                {isAttenuator && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Attenuation (dB)</label>
                        <input
                            type="number"
                            value={attenuation}
                            onChange={(e) => setAttenuation(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-md p-2 text-gray-900"
                            step="0.1"
                            min="0"
                        />
                    </div>
                )}

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};
