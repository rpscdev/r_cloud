interface StrategySectionCardProps {
  title: string;
  items: string[];
  accentClassName: string;
  emptyMessage?: string;
}

export default function StrategySectionCard({
  title,
  items,
  accentClassName,
  emptyMessage = 'No items generated for this section yet.',
}: StrategySectionCardProps) {
  return (
    <section className="rounded-2xl border border-blue-900/80 bg-black/60 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${accentClassName}`} />
        <h3 className="text-lg font-semibold text-blue-100">{title}</h3>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-blue-200">{emptyMessage}</p>
      ) : (
        <ul className="space-y-3 text-sm leading-relaxed text-blue-100">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="rounded-xl border border-indigo-900/60 bg-indigo-950/35 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
