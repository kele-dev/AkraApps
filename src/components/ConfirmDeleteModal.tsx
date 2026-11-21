"use client";

import React from 'react';
import { Card } from './Card';
import { Modal } from './Modal';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
}

/** Shared destructive action confirmation dialog. */
export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  cancelLabel,
  confirmLabel,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    ariaLabel={title}
    backdropClassName="bg-black/60 backdrop-blur-xs"
  >
    {isOpen && (
      <Card className="max-w-xs w-full p-6 flex flex-col gap-4 animate-slide-in">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3 text-lg">
            ⚠️
          </div>
          <h4 className="text-sm font-bold text-text-slate-dark mb-1">{title}</h4>
          <p className="text-xs text-text-slate-medium leading-relaxed">{description}</p>
        </div>
        <div className="flex gap-2.5 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1 py-2 text-xs font-bold rounded-lg border-none cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white flex-1 py-2 text-xs font-bold rounded-lg border-none cursor-pointer shadow-sm transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </Card>
    )}
  </Modal>
);
