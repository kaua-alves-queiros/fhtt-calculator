import React, { useEffect, useRef } from 'react';

interface ContextMenuProps {
    x: number;
    y: number;
    onDelete: () => void;
    onClose: () => void;
}

export const ContextMenu = ({ x, y, onDelete, onClose }: ContextMenuProps) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    return (
        <div
            ref={ref}
            style={{ top: y, left: x }}
            className="fixed z-50 bg-white border border-gray-200 shadow-lg rounded-md py-1 min-w-[120px]"
        >
            <button
                onClick={onDelete}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
                Delete
            </button>
        </div>
    );
};
