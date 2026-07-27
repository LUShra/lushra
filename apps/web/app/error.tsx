"use client";

type ErrorPageProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function ErrorPage({
  error,
  reset
}: ErrorPageProps) {
  return (
    <main className="state-page">
      <p className="eyebrow">Application error</p>
      <h1>Something went wrong</h1>
      <p>
        We couldn&apos;t complete that. Try again, or come back in a moment.
        {error.digest ? ` (Reference: ${error.digest})` : null}
      </p>

      <button
        className="button button--primary"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </main>
  );
}
