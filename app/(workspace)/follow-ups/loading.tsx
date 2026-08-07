export default function FollowUpsLoading() {
  return (
    <div aria-label="Cargando seguimientos" aria-busy="true">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-subtitle" />
      <div className="skeleton skeleton-panel" />
    </div>
  );
}

