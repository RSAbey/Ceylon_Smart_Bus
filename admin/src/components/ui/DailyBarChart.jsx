// Daily bar chart shared by Performance and Tickets & Finance. Plain CSS bars rather than a charting
// library, so the dashboard adds no dependency for a handful of simple series and the markup stays
// readable in a viva. The figure is written above every bar, so the chart never relies on height
// alone to be read.
const PERCENT_SCALE = 100;
/** Extra room above the tallest bar when a target line is drawn. */
const TARGET_HEADROOM = 1.15;

/**
 * One bar chart drawn from a daily series.
 * @param {object} props - Component props.
 * @param {string} props.title - What the chart shows.
 * @param {Array<{day: string, total: number}>} props.dailySeries - One entry per day, oldest first.
 * @param {string} [props.valuePrefix] - Prefix for the value, for example "Rs.".
 * @param {string} [props.valueSuffix] - Suffix for the value, for example "%".
 * @param {string} [props.subtitle] - One line under the title saying what is being measured.
 * @param {number} [props.targetValue] - Draws a labelled line across the chart at this value.
 * @returns {import('react').JSX.Element} The chart.
 */
export default function DailyBarChart({
  title,
  dailySeries,
  valuePrefix = '',
  valueSuffix = '',
  subtitle,
  targetValue,
}) {
  // A floor of 1 keeps the division safe on a day when nothing at all was recorded. The target is
  // part of the ceiling too, so a week that never reaches it still shows the line it fell short of.
  const tallestValue = Math.max(
    ...dailySeries.map((dailyEntry) => dailyEntry.total),
    targetValue || 0,
    1
  );
  // With a target line the chart keeps a little headroom, so the line sits inside the plot rather
  // than along its top edge in a week that just reached it.
  const chartCeiling = targetValue === undefined ? tallestValue : tallestValue * TARGET_HEADROOM;
  const targetHeightPercent =
    targetValue === undefined ? null : Math.round((targetValue / chartCeiling) * PERCENT_SCALE);

  return (
    <section className="card" aria-label={title}>
      <h2 className="text-heading3">{title}</h2>
      {subtitle && <p className="text-caption text-muted">{subtitle}</p>}
      <ol className="bar-chart">
        {targetHeightPercent !== null && (
          <li className="bar-chart__target" style={{ bottom: `${targetHeightPercent}%` }}>
            <span className="text-caption">
              {targetValue}
              {valueSuffix} target
            </span>
          </li>
        )}
        {dailySeries.map((dailyEntry) => {
          const barHeightPercent = Math.round((dailyEntry.total / chartCeiling) * PERCENT_SCALE);
          const dayLabel = new Date(dailyEntry.day).toLocaleDateString(undefined, {
            weekday: 'short',
          });
          return (
            <li key={dailyEntry.day} className="bar-chart__column">
              <span className="bar-chart__value text-caption">
                {valuePrefix}
                {dailyEntry.total}
                {valueSuffix}
              </span>
              <div
                className="bar-chart__bar"
                style={{ height: `${barHeightPercent}%` }}
                role="img"
                aria-label={`${dayLabel}: ${valuePrefix}${dailyEntry.total}${valueSuffix}`}
              />
              <span className="bar-chart__label text-caption text-muted">{dayLabel}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
