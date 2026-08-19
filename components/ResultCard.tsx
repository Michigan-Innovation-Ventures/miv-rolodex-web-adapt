import type { SearchResult } from "@/types/contact";

/** A retrieved contact rendered as a rolodex index card. */
export default function ResultCard({ result, rank }: { result: SearchResult; rank: number }) {
  const pct = Math.max(0, Math.min(1, result.score));

  return (
    <article className="index-card px-5 pb-4 pt-6">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-display text-2xl leading-tight">{result.name}</h3>
        <span className="shrink-0 font-mono text-[11px] text-muted">№ {rank}</span>
      </div>
      <p className="mt-0.5 text-sm text-muted">
        {result.title}
        {result.title && result.company ? " · " : ""}
        {result.company}
      </p>

      {result.email && (
        <a
          href={`mailto:${result.email}`}
          className="mt-2 inline-block font-mono text-xs text-oxblood underline decoration-line underline-offset-2 hover:decoration-oxblood"
        >
          {result.email}
        </a>
      )}

      {result.expertise && (
        <p className="mt-3 text-[13px] leading-relaxed text-ink/80">{result.expertise}</p>
      )}

      <div className="mt-4 flex items-center gap-3 border-t border-line pt-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Match</span>
        <div
          role="meter"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={1}
          aria-label={`Relevance ${result.score}`}
          className="h-px flex-1 bg-line"
        >
          <div className="h-px bg-oxblood" style={{ width: `${pct * 100}%` }} />
        </div>
        <span className="font-mono text-xs text-ink">{result.score.toFixed(2)}</span>
      </div>
    </article>
  );
}
