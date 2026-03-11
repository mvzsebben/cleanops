import * as React from "react";
import { cn } from "@/lib/utils";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "min-h-11 w-full rounded-lg border border-transparent bg-[#f2f3f5] px-3 text-sm text-[#111827] outline-none transition duration-200 placeholder:text-[#9ca3af] focus:border-[#007AFF] focus:bg-white focus:ring-2 focus:ring-[#007AFF]/15",
        props.className,
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-24 w-full rounded-lg border border-transparent bg-[#f2f3f5] px-3 py-3 text-sm text-[#111827] outline-none transition duration-200 placeholder:text-[#9ca3af] focus:border-[#007AFF] focus:bg-white focus:ring-2 focus:ring-[#007AFF]/15",
        props.className,
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "min-h-11 w-full rounded-lg border border-transparent bg-[#f2f3f5] px-3 text-sm text-[#111827] outline-none transition duration-200 focus:border-[#007AFF] focus:bg-white focus:ring-2 focus:ring-[#007AFF]/15",
        props.className,
      )}
    />
  );
}
