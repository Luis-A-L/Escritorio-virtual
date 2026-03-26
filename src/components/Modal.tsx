import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#03070c]/78 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#09131d]/96 shadow-[0_28px_80px_rgba(0,0,0,0.42)]">
        <div className="flex items-center justify-between border-b border-white/8 bg-white/[0.03] px-5 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300">Painel</p>
            <h2 className="mt-1 text-lg font-bold text-white">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            aria-label="Fechar modal"
          >
            x
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
