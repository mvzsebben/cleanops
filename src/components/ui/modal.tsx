"use client";

import { X } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ open, title, description, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#111827]">{title}</h2>
            {description ? <p className="mt-1 text-sm text-[#6b7280]">{description}</p> : null}
          </div>
          <button
            aria-label="Close"
            className="rounded-full p-2 text-[#6b7280] transition hover:bg-[#f2f3f5]"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </Card>
    </div>
  );
}
