import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div>
          <p className="eyebrow">Join Lushra</p>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-description">
            Account registration will be connected to Supabase in a later stage.
          </p>
        </div>

        <form className="auth-form">
          <label className="form-field">
            <span>Full name</span>
            <input
              autoComplete="name"
              name="fullName"
              placeholder="Your full name"
              type="text"
            />
          </label>

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
              autoComplete="new-password"
              name="password"
              placeholder="Create a secure password"
              type="password"
            />
          </label>

          <button className="button button--primary" disabled type="button">
            Create account
          </button>
        </form>

        <p className="auth-footer">
          Already registered?{" "}
          <Link href="/auth/sign-in">Sign in</Link>
        </p>

        <Link className="back-link" href="/">
          Return home
        </Link>
      </section>
    </main>
  );
}
