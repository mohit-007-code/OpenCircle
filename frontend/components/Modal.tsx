// frontend/src/components/Modal.tsx
'use client';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
  showActions?: boolean;
  children?: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  loading = false,
  showActions = true,
  children,
}: ModalProps) {
  if (!isOpen) return null;

  const confirmButtonClass = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-[#ff4500] hover:bg-[#ff5414]',
  }[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fadeIn">
      <div className="bg-[#1a1a1b] border border-[#343536] rounded-lg max-w-md w-full animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#343536]">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#272729] rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {message && <p className="text-[#d7dadc]">{message}</p>}
          {children}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-3 p-4 border-t border-[#343536]">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#272729] hover:bg-[#343536] rounded font-semibold transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            {onConfirm && (
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 px-4 py-2 text-white rounded font-semibold transition-colors disabled:opacity-50 ${confirmButtonClass}`}
              >
                {loading ? 'Loading...' : confirmText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
