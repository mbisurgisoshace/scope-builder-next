'use client';

import { memo, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ZapIcon, PlusIcon } from 'lucide-react';

import { NodeTypeMenu } from '../components/NodeTypeMenu';
import { useJourneyContext, type JourneyNodeType, type JourneyNodeData } from '../JourneyContext';

function TriggerNodeInner({ id, data }: NodeProps) {
  const nodeData = data as unknown as JourneyNodeData;
  const { addChildNode, updateNodeData, participants } = useJourneyContext();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSelect = useCallback(
    (type: JourneyNodeType) => {
      addChildNode(id, type);
      setMenuOpen(false);
    },
    [id, addChildNode]
  );

  return (
    <div className="nopan nodrag pointer-events-auto w-[240px] bg-[#EEF1FF] border border-[#C7CEFF] rounded-xl p-4 relative shadow-sm">
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="!opacity-0 !pointer-events-none"
      />

      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-indigo-100 rounded-md flex items-center justify-center flex-shrink-0">
          <ZapIcon className="w-3.5 h-3.5 text-indigo-600" />
        </div>
        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
          Trigger
        </span>
      </div>

      {participants.length > 0 && (
        <select
          className="nodrag nopan w-full text-xs border border-indigo-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 mb-3 focus:outline-none focus:ring-1 focus:ring-indigo-300"
          value={nodeData.stakeholderId ?? ''}
          onChange={(e) =>
            updateNodeData(id, { stakeholderId: e.target.value || null })
          }
        >
          <option value="">Stakeholder...</option>
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      <textarea
        className="nodrag nopan w-full text-sm text-gray-700 bg-transparent resize-none placeholder-gray-400 focus:outline-none leading-snug"
        rows={3}
        placeholder="Type your trigger..."
        value={nodeData.content ?? ''}
        onChange={(e) => updateNodeData(id, { content: e.target.value })}
      />

      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="!opacity-0 !pointer-events-none"
      />

      {/* "+" button — positioned on the right edge, outside the card boundary */}
      <div className="nopan nodrag absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-1">
        <button
          className="nodrag nopan w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow hover:bg-indigo-600 transition-colors"
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

export const TriggerNode = memo(TriggerNodeInner);
