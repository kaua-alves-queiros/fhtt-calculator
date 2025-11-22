import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { FHTTNodeData } from '@/lib/fhtt/types';
import { clsx } from 'clsx';
import { Router, Split, CircleDot, Activity } from 'lucide-react';

const NodeWrapper = ({ children, selected, className }: { children: React.ReactNode, selected?: boolean, className?: string }) => (
    <div className={clsx(
        "px-4 py-2 shadow-md rounded-md bg-white border-2 min-w-[150px]",
        selected ? "border-blue-500" : "border-gray-200",
        className
    )}>
        {children}
    </div>
);

export const OLTNode = memo(({ data, selected }: NodeProps<FHTTNodeData>) => {
    return (
        <NodeWrapper selected={selected} className="border-green-500 bg-green-50">
            <div className="flex items-center gap-2 mb-2 border-b border-green-200 pb-1">
                <Router size={16} className="text-green-700" />
                <div className="font-bold text-sm text-green-900">PON</div>
            </div>
            {data.description && (
                <div className="text-[10px] text-gray-500 mb-1 italic max-w-[150px] truncate">
                    {data.description}
                </div>
            )}
            <div className="text-xs text-gray-600">
                Power: <strong>{data.power} dBm</strong>
            </div>
            <Handle type="source" position={Position.Right} id="out" className="w-3 h-3 bg-green-500" />
        </NodeWrapper>
    );
});

export const SplitterNode = memo(({ data, selected }: NodeProps<FHTTNodeData>) => {
    const isBalanced = data.type === 'SPLITTER_BALANCED';
    const inputSignal = data.inputSignal !== undefined && data.inputSignal !== null
        ? data.inputSignal.toFixed(2)
        : '--';

    return (
        <NodeWrapper selected={selected} className={isBalanced ? "border-blue-400" : "border-orange-400"}>
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-gray-500" />

            <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-1">
                <Split size={16} className={isBalanced ? "text-blue-600" : "text-orange-600"} />
                <div className="font-bold text-sm">{data.label}</div>
            </div>
            {data.description && (
                <div className="text-[10px] text-gray-500 mb-1 italic max-w-[150px] truncate">
                    {data.description}
                </div>
            )}

            <div className="text-xs space-y-1">
                <div className="flex justify-between">
                    <span>In:</span>
                    <span className={clsx("font-mono", Number(inputSignal) < -25 ? "text-red-500" : "text-gray-700")}>
                        {inputSignal} dBm
                    </span>
                </div>
                <div className="text-gray-500">Ratio: {data.ratio}</div>
            </div>

            <Handle type="source" position={Position.Right} id="out" className="w-3 h-3 bg-gray-500" />
        </NodeWrapper>
    );
});

export const ONUNode = memo(({ data, selected }: NodeProps<FHTTNodeData>) => {
    const inputSignal = data.inputSignal !== undefined && data.inputSignal !== null
        ? data.inputSignal.toFixed(2)
        : '--';

    const isLow = Number(inputSignal) < -25; // Example threshold

    return (
        <NodeWrapper selected={selected} className="border-purple-500">
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-purple-500" />
            <div className="flex items-center gap-2 mb-2 border-b border-purple-100 pb-1">
                <CircleDot size={16} className="text-purple-700" />
                <div className="font-bold text-sm text-purple-900">{data.label}</div>
            </div>
            {data.description && (
                <div className="text-[10px] text-gray-500 mb-1 italic max-w-[150px] truncate">
                    {data.description}
                </div>
            )}
            <div className="text-xs flex justify-between items-center">
                <span>Rx:</span>
                <span className={clsx("font-bold font-mono", isLow ? "text-red-600" : "text-green-600")}>
                    {inputSignal} dBm
                </span>
            </div>
        </NodeWrapper>
    );
});

export const AttenuatorNode = memo(({ data, selected }: NodeProps<FHTTNodeData>) => {
    const inputSignal = data.inputSignal !== undefined && data.inputSignal !== null
        ? data.inputSignal.toFixed(2)
        : '--';

    return (
        <NodeWrapper selected={selected} className="border-gray-400 bg-gray-50 min-w-[100px]">
            <Handle type="target" position={Position.Left} className="w-2 h-2 bg-gray-600" />
            <div className="flex items-center gap-2 mb-1">
                <Activity size={14} className="text-gray-600" />
                <div className="font-bold text-xs">{data.label}</div>
            </div>
            {data.description && (
                <div className="text-[8px] text-gray-500 mb-1 italic max-w-[100px] truncate">
                    {data.description}
                </div>
            )}
            <div className="text-xs text-gray-500">Loss: {data.attenuation} dB</div>
            <div className="text-xs text-gray-500">In: {inputSignal} dBm</div>
            <Handle type="source" position={Position.Right} id="out" className="w-2 h-2 bg-gray-600" />
        </NodeWrapper>
    );
});
