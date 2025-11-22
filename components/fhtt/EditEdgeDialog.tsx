import React, { useState, useEffect } from 'react';
import { FHTTEdgeData } from '@/lib/fhtt/types';
import { Edge } from '@xyflow/react';

interface EditEdgeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (edgeId: string, updates: Partial<FHTTEdgeData>) => void;
    edge: Edge<FHTTEdgeData> | null;
}

export const EditEdgeDialog = ({ isOpen, onClose, onConfirm, edge }: EditEdgeDialogProps) => {
    const [length, setLength] = useState(0);

    useEffect(() => {
        if (isOpen && edge) {
            setLength(edge.data?.length || 0);
        }
    }, [isOpen, edge]);

    if (!isOpen || !edge) return null;

    const handleConfirm = () => {
        onConfirm(edge.id, { length });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-full text-gray-900">
                <h2 className="text-lg font-bold mb-4 text-gray-900">Edit Link</h2>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cable Length (meters)</label>
                    <input
                        type="number"
                        value={length}
                        onChange={(e) => setLength(Math.max(0, Number(e.target.value)))}
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
