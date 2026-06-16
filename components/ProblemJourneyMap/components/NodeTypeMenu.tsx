'use client';

import { useEffect, useRef } from 'react';
import { ZapIcon, PlayIcon, GitForkIcon } from 'lucide-react';
import type { JourneyNodeType } from '../JourneyContext';

interface NodeTypeMenuProps {
  onSelect: (type: JourneyNodeType) => void;
  onClose: () => void;
}

const OPTIONS: { type: JourneyNodeType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    type: 'trigger',
    label: 'Trigger',
    description: 'Starts the journey',
    icon: <ZapIcon className="w-4 h-4 text-indigo-500" />,
  },
  {
    type: 'action',
    label: 'Action',
    description: 'What a user does at a particular step',
    icon: <PlayIcon className="w-4 h-4 text-blue-500" />,
  },
  {
    type: 'split_route',
    label: 'Split route',
    description: 'Create independent branches',
    icon: <GitForkIcon className="w-4 h-4 text-orange-500" />,
  },
];

export function NodeTypeMenu({ onSelect, onClose }: NodeTypeMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="nodrag nopan absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden"
    >
      {OPTIONS.map(({ type, label, description, icon }) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="mt-0.5 flex-shrink-0">{icon}</div>
          <div>
            <div className="text-sm font-medium text-gray-800">{label}</div>
            <div className="text-xs text-gray-400 leading-snug">{description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
