import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-lg",
  className,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />
      {/* Modal Content */}
      <div
        className={cn(
          "relative z-50 w-full rounded-xl border border-zinc-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150 overflow-hidden max-h-[90vh] flex flex-col",
          maxWidth,
          className
        )}
      >
        <div className="flex items-start justify-between pb-4 border-b border-zinc-100">
          <div>
            {title && (
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs text-zinc-500 mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto pt-4 flex-1">{children}</div>
      </div>
    </div>
  );
};
