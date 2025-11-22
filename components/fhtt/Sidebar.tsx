import React from 'react';
import { FHTTNodeType } from '@/lib/fhtt/types';
import { Router, Split, Activity, CircleDot } from 'lucide-react';

export const Sidebar = () => {
    const onDragStart = (event: React.DragEvent, nodeType: FHTTNodeType, label: string, data?: any) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/fhtt-label', label);
        if (data) {
            event.dataTransfer.setData('application/fhtt-data', JSON.stringify(data));
        }
        event.dataTransfer.effectAllowed = 'move';
    };

    const balancedSplitters = [
        { ratio: '1:2', loss: 3.5 },
        { ratio: '1:4', loss: 7.0 },
        { ratio: '1:8', loss: 10.5 },
        { ratio: '1:16', loss: 14.0 },
        { ratio: '1:32', loss: 17.5 },
        { ratio: '1:64', loss: 21.0 },
        { ratio: '1:128', loss: 24.5 },
    ];

    const unbalancedSplitters = [
        { ratio: '1/99', loss1: 20.0, loss2: 0.1 },
        { ratio: '2/98', loss1: 17.0, loss2: 0.2 },
        { ratio: '5/95', loss1: 13.5, loss2: 0.5 },
        { ratio: '10/90', loss1: 10.5, loss2: 0.6 },
        { ratio: '15/85', loss1: 8.5, loss2: 0.9 },
        { ratio: '20/80', loss1: 7.3, loss2: 1.2 },
        { ratio: '25/75', loss1: 6.3, loss2: 1.5 },
        { ratio: '30/70', loss1: 5.5, loss2: 1.8 },
        { ratio: '35/65', loss1: 4.8, loss2: 2.1 },
        { ratio: '40/60', loss1: 4.2, loss2: 2.4 },
        { ratio: '45/55', loss1: 3.7, loss2: 2.9 },
        { ratio: '50/50', loss1: 3.5, loss2: 3.5 },
    ];

    return (
        <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-4 overflow-y-auto h-full">
            <h2 className="font-bold text-lg text-gray-800">Components</h2>
            <div className="text-sm text-gray-500 mb-2">Drag and drop to canvas</div>

            <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Source</h3>
                <div
                    className="bg-green-50 p-2 border border-green-200 rounded cursor-grab mb-2 flex items-center gap-2"
                    onDragStart={(event) => onDragStart(event, 'OLT', 'PON', { power: 3 })}
                    draggable
                >
                    <Router size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-gray-900">PON</span>
                </div>
            </div>

            <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Balanced Splitters</h3>
                {balancedSplitters.map((s) => (
                    <div
                        key={s.ratio}
                        className="p-2 border border-blue-400 bg-blue-50 rounded cursor-move hover:shadow-md transition-shadow"
                        onDragStart={(event) => onDragStart(event, 'SPLITTER_BALANCED', `Splitter ${s.ratio}`, { ratio: s.ratio, loss: s.loss })}
                        draggable
                    >
                        <div className="font-bold text-blue-900 text-sm">Splitter {s.ratio}</div>
                        <div className="text-xs text-gray-600">Loss: {s.loss} dB</div>
                    </div>
                ))}
            </div>

            <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Unbalanced Splitters</h3>
                {unbalancedSplitters.map((s) => {
                    const [p1, p2] = s.ratio.split('/');
                    return (
                        <div
                            key={s.ratio}
                            className="p-2 border border-orange-400 bg-orange-50 rounded cursor-move hover:shadow-md transition-shadow"
                            onDragStart={(event) => onDragStart(event, 'SPLITTER_UNBALANCED', `Splitter ${s.ratio}`, {
                                ratio: s.ratio.replace('/', ':'),
                                portLosses: { [`out-${p1}`]: s.loss1, [`out-${p2}`]: s.loss2 }
                            })}
                            draggable
                        >
                            <div className="font-bold text-orange-900 text-sm">Splitter {s.ratio}</div>
                            <div className="text-xs text-gray-600">{p1}%: -{s.loss1}dB | {p2}%: -{s.loss2}dB</div>
                        </div>
                    );
                })}
            </div>

            <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Others</h3>
                <div
                    className="p-3 border border-gray-400 bg-gray-50 rounded cursor-move hover:shadow-md transition-shadow"
                    onDragStart={(event) => onDragStart(event, 'ATTENUATOR', 'Connector', { attenuation: 0.5 })}
                    draggable
                >
                    <div className="font-bold text-gray-900">Connector/Splice</div>
                    <div className="text-xs text-gray-600">Loss 0.5 dB</div>
                </div>

                <div
                    className="p-3 border border-purple-500 bg-purple-50 rounded cursor-move hover:shadow-md transition-shadow"
                    onDragStart={(event) => onDragStart(event, 'ONU', 'ONU Client')}
                    draggable
                >
                    <div className="font-bold text-purple-900">ONU</div>
                    <div className="text-xs text-gray-600">Receiver</div>
                </div>
            </div>
        </aside>
    );
};
