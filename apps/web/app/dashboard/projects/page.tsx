export default function Page() {
  return (
    <div className="dashboard-page">
      <section className="dashboard-intro">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="dashboard-title">Projects</h1>
        </div>

        <p>Project management capabilities will appear here.</p>
      </section>

      <section className="dashboard-panel empty-panel">
        <p>No data is available yet.</p>
      </section>
    </div>
  );
}
