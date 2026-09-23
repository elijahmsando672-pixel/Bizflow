import * as React from "react";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string }>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ${className || ""}`}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
