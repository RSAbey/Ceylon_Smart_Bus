// Daily bar chart shared by Performance and Tickets & Finance. Plain CSS bars rather than a charting
// library, so the dashboard adds no dependency for a handful of simple series and the markup stays
// readable in a viva. The figure is written above every bar, so the chart never relies on height
// alone to be read.
const PERCENT_SCALE = 100;

/**
 * One bar chart drawn from a daily series.
 * @param {object} props - Component props.
 * @param {string} props.title - What the chart shows.
 * @param {Array<{day: string, total: number}>} props.dailySeries - One entry per day, oldest first.
 * @param {string} [props.valuePrefix] - Prefix for the value, for example "Rs.".
 * @returns {import('react').JSX.Element} The chart.
 */
export default function DailyBarChart({ title, dailySeries, valuePrefix = '' }) {
  // A floor of 1 keeps the division safe on a day when nothing at all was recorded.
  const highestTotal = Math.max(...dailySeries.map((dailyEntry) => dailyEntry.total), 1);

  return (
    <section className="card" aria-label={title}>
      <h2 className="text-heading3">{title}</h2>
      <ol className="bar-chart">
        {dailySeries.map((dailyEntry) => {
          const barHeightPercent = Math.round((dailyEntry.total / highestTotal) * PERCENT_SCALE);
          const dayLabel = new Date(dailyEntry.day).toLocaleDateString(undefined, {
            weekday: 'short',
          });
          return (
            <li key={dailyEntry.day} className="bar-chart__column">
              <span className="bar-chart__value text-caption">
                {valuePrefix}
                {dailyEntry.total}
              </span>
              <div
                className="bar-chart__bar"
                style={{ height: `${barHeightPercent}%` }}
                role="img"
                aria-label={`${dayLabel}: ${valuePrefix}${dailyEntry.total}`}
              />
              <span className="bar-chart__label text-caption text-muted">{dayLabel}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
