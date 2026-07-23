const metrics = [
  {
    label: "Projects",
    value: "0",
    description: "No active projects yet"
  },
  {
    label: "Team members",
    value: "1",
    description: "Workspace owner"
  },
  {
    label: "Recent activity",
    value: "0",
    description: "No recorded events"
  }
];

export default function DashboardPage() {
  return (
    <div className="dashboard-page">
      <section className="dashboard-intro">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 className="dashboard-title">Your Lushra workspace</h1>
        </div>

        <p>
          This dashboard is the initial authenticated product shell. Live
          account data and Supabase authentication will be connected later.
        </p>
      </section>

      <section aria-label="Workspace metrics" className="metric-grid">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.description}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel__header">
          <div>
            <p className="eyebrow">Getting started</p>
            <h2>Platform setup</h2>
          </div>

          <span className="status-badge">In progress</span>
        </div>

        <div className="setup-list">
          <div className="setup-item">
            <span>01</span>
            <div>
              <strong>Workspace foundation</strong>
              <p>Monorepo and Next.js application structure created.</p>
            </div>
          </div>

          <div className="setup-item">
            <span>02</span>
            <div>
              <strong>Authentication connection</strong>
              <p>Supabase credentials and server-side sessions pending.</p>
            </div>
          </div>

          <div className="setup-item">
            <span>03</span>
            <div>
              <strong>Product implementation</strong>
              <p>Core Lushra capabilities will be added after architecture.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
