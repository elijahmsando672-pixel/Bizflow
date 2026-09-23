"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex items-center justify-center min-h-screen p-8">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-3xl font-bold text-destructive">Application Error</h1>
            <p className="text-muted-foreground">{error.message || "A critical error occurred"}</p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
