import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ModerationWarningModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export function ModerationWarningModal({ isOpen, message, onClose }: ModerationWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999999 }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-bold text-lg">Content Warning</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700 text-base leading-relaxed mb-4">
            {message}
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-amber-800">
              Your content will be posted, but please be mindful of community guidelines.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3 px-4 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
