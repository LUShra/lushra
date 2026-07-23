import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1 className="auth-title">Sign in to Lushra</h1>
          <p className="auth-description">
            Authentication will be connected to Supabase in a later stage.
          </p>
        </div>

        <form className="auth-form">
          <label className="form-field">
            <span>Email address</span>
            <input
              autoComplete="email"
              name="email"
              placeholder="you@example.com"
              type="email"
            />
          </label>

          <label className="form-field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              name="password"
              placeholder="Enter your password"
              type="password"
            />
          </label>

          <button className="button button--primary" disabled type="button">
            Sign in
          </button>
        </form>

        <p className="auth-footer">
          New to Lushra?{" "}
          <Link href="/auth/sign-up">Create an account</Link>
        </p>

        <Link className="back-link" href="/">
          Return home
        </Link>
      </section>
    </main>
  );
}
