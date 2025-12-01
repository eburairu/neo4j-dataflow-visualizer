import { ReactNode } from 'react';

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function Placeholder({ children }: { children: ReactNode }) {
  return <div className="placeholder">{children}</div>;
}
