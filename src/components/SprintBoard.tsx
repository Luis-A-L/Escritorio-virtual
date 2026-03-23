import React from 'react';

export default function SprintBoard({ isOpen, onClose }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
      <div className="bg-[#1a1a2e] border-2 border-[#f7c948] rounded-xl max-w-4xl w-full h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-black/50">
          <h2 className="text-[#f7c948] font-bold text-xl">📋 SPRINT BOARD</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="p-4 flex-1 text-center text-gray-500 flex items-center justify-center">
          Sprint Board - Restored implicitly.
        </div>
      </div>
    </div>
  );
}
