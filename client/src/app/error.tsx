"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="text-center space-y-4 max-w-md">
<h2 className="text-2xl font-bold text-destructive">Something went wrong</h2>
          <p className="text-muted-foreground">{error?.message || "An unexpected error occurred"}</p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-colors"
          >
          Try again
        </button>
      </div>
    </div>
  );
}
