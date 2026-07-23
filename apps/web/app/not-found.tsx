import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="state-page">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p>The page you requested does not exist.</p>

      <Link className="button button--primary" href="/">
        Return home
      </Link>
    </main>
  );
}
