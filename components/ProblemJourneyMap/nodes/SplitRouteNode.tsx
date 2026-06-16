'use client';

import { memo, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GitForkIcon, PlusIcon } from 'lucide-react';

import { NodeTypeMenu } from '../components/NodeTypeMenu';
import { useJourneyContext, type JourneyNodeType } from '../JourneyContext';

function SplitRouteNodeInner({ id }: NodeProps) {
  const { addChildNode } = useJourneyContext();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSelect = useCallback(
    (type: JourneyNodeType) => {
      addChildNode(id, type);
      setMenuOpen(false);
    },
    [id, addChildNode]
  );

  return (
    <div className="nopan nodrag pointer-events-auto w-[180px] bg-[#FFF7ED] border border-orange-200 rounded-xl p-4 relative shadow-sm flex items-center gap-3">
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="!opacity-0 !pointer-events-none"
      />

      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <GitForkIcon className="w-4 h-4 text-orange-500" />
      </div>
      <div>
        <div className="text-xs font-semibold text-orange-500 uppercase tracking-wide leading-tight">
          Split route
        </div>
        <div className="text-xs text-gray-400 mt-0.5">Branches here</div>
      </div>

      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="!opacity-0 !pointer-events-none"
      />

      <div className="nopan nodrag absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-1">
        <button
          className="nodrag nopan w-6 h-6 rounded-full bg-orange-400 text-white flex items-center justify-center shadow hover:bg-orange-500 transition-colors"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <PlusIcon className="w-3.5 h-3.5" />
        </button>
        {menuOpen && (
          <NodeTypeMenu onSelect={handleSelect} onClose={() => setMenuOpen(false)} />
        )}
      </div>
    </div>
  );
}

export const SplitRouteNode = memo(SplitRouteNodeInner);
