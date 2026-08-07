export default function DashboardLoading() {
  return (
    <div aria-label="Cargando dashboard" aria-busy="true">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-subtitle" />
      <div className="skeleton skeleton-panel" />
    </div>
  );
}
