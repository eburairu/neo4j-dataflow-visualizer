import { PropsWithChildren } from 'react';

export function Page({ children }: PropsWithChildren) {
  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="eyebrow">Neo4j data lineage</p>
          <h1>Dataflow Visualizer</h1>
          <p className="muted">Explore pipeline dependencies and compare snapshots.</p>
        </div>
      </header>
      <main className="page__main">{children}</main>
    </div>
  );
}

export function Panel({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <section className="panel">
      <div className="panel__header">
        <h2>{title}</h2>
      </div>
      <div className="panel__body">{children}</div>
    </section>
  );
}
