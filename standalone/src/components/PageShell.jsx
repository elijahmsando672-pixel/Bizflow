export default function PageShell({ title, subtitle, children }) {
  return (
    <>
      <div className="greeting">
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="greeting-sub">{subtitle}</p>}
        </div>
      </div>
      {children || (
        <div className="placeholder-card">
          <p>This page is under development.</p>
        </div>
      )}
    </>
  );
}
