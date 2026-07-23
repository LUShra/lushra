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
      <p>{error.message || "An unexpected error occurred."}</p>

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
