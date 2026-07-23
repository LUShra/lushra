import Link from "next/link";

export default function HomePage() {
  return (
    <main className="site-shell">
      <section className="hero">
        <div className="hero__content">
          <p className="eyebrow">Lushra</p>

          <h1>Building the foundation for something exceptional.</h1>

          <p className="hero__description">
            Lushra is currently being developed as a secure,
            modern, and scalable digital platform.
          </p>

          <div className="hero__actions">
            <Link className="button button--primary" href="/auth/sign-up">
              Create account
            </Link>

            <Link className="button button--secondary" href="/auth/sign-in">
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
