export default function Page() {
  return (
    <div className="dashboard-page">
      <section className="dashboard-intro">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="dashboard-title">Settings</h1>
        </div>

        <p>Workspace and account configuration will appear here.</p>
      </section>

      <section className="dashboard-panel empty-panel">
        <p>No data is available yet.</p>
      </section>
    </div>
  );
}
