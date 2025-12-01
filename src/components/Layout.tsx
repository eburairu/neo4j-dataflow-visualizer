import { PropsWithChildren } from 'react';

export function Page({ children }: PropsWithChildren) {
  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="eyebrow">Neo4j データリネージ</p>
          <h1>データフロー可視化ツール</h1>
          <p className="muted">パイプラインの依存関係をたどり、スナップショット同士を比較できます。</p>
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
