import { useId } from "react";

import { cn } from "@/lib/utils";

export function Paragraph({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-muted-foreground leading-relaxed mb-4", className)}>
      {children}
    </p>
  );
}

export function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-foreground">{children}</strong>;
}

export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-12 scroll-mt-24">
      <h2 className="font-display text-2xl font-semibold text-foreground mb-6">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h3 className="font-display text-lg font-medium text-foreground mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function BulletList({ items }: { items: React.ReactNode[] }) {
  const id = useId();
  return (
    <ul className="space-y-2 mb-4 ml-4">
      {items.map((item, index) => (
        <li
          key={`${id}-${index}`}
          className="flex items-start gap-3 text-muted-foreground"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function NumberedList({ items }: { items: React.ReactNode[] }) {
  const id = useId();
  return (
    <ol className="space-y-2 mb-4 ml-4">
      {items.map((item, index) => (
        <li
          key={`${id}-${index}`}
          className="flex items-start gap-3 text-muted-foreground"
        >
          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <span className="pt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  );
}

export function ImportantNotice({
  children,
  variant = "warning",
}: {
  children: React.ReactNode;
  variant?: "warning" | "info";
}) {
  return (
    <div
      className={cn(
        "p-6 rounded-2xl border-2 mb-6",
        variant === "warning"
          ? "bg-destructive/5 border-destructive/20 text-destructive"
          : "bg-primary/5 border-primary/20 text-foreground"
      )}
    >
      <div className="font-semibold text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  const id = useId();
  return (
    <div className="overflow-x-auto mb-6">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="text-left p-3 bg-secondary/50 font-semibold text-foreground text-sm border-b border-primary/10"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${id}-row-${rowIndex}`} className="border-b border-primary/5">
              {row.map((cell, cellIndex) => (
                <td
                  key={`${id}-cell-${rowIndex}-${cellIndex}`}
                  className="p-3 text-muted-foreground text-sm"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Divider() {
  return <hr className="my-12 border-t-2 border-primary/10" />;
}

export function ContactCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 bg-secondary/50 rounded-xl border border-primary/20">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h4 className="font-display text-lg font-semibold text-foreground">
          {title}
        </h4>
      </div>
      <div className="text-muted-foreground text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export function TableOfContents({ items }: { items: string[] }) {
  return (
    <nav className="my-8 p-6 bg-secondary/30 rounded-2xl border border-primary/10">
      <h2 className="font-display text-xl font-semibold text-foreground mb-4">
        Table of Contents
      </h2>
      <ol className="grid sm:grid-cols-2 gap-2 text-sm">
        {items.map((item, index) => (
          <li key={item}>
            <a
              href={`#${item.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              className="text-primary hover:text-primary/80 transition-colors"
            >
              {index + 1}. {item}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
