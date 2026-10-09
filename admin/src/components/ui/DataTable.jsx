// Config-driven table with loading skeleton, empty state, error + retry and optional per-row actions.
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import Button from './Button';

const SKELETON_ROW_COUNT = 5;

/**
 * Renders one cell: the column's renderCell function, or the raw field.
 * @param {object} column - Column config { key, header, renderCell? }.
 * @param {object} tableRow - Row object.
 * @returns {import('react').ReactNode} Cell content.
 */
function renderTableCell(column, tableRow) {
  return column.renderCell ? column.renderCell(tableRow) : tableRow[column.key];
}

/**
 * Data table used by every admin list page.
 * @param {object} props - Component props.
 * @param {Array<{key: string, header: string, renderCell?: Function}>} props.columns - Column definitions.
 * @param {object[]} props.rows - Rows to show.
 * @param {Function} [props.getRowKey] - Unique key per row (default row.id).
 * @param {boolean} [props.isLoading] - Show skeleton rows.
 * @param {string} [props.errorMessage] - Show the error state with this message.
 * @param {Function} [props.onRetry] - Retry handler for the error state.
 * @param {string} [props.emptyTitle] - Empty state headline.
 * @param {string} [props.emptyMessage] - Empty state explanation.
 * @param {Array<{label: string, icon?: import('react').ComponentType, onClick: Function, variant?: string,
 *   buildAriaLabel?: Function, isAvailable?: Function}>} [props.rowActions] Buttons shown at the end of each
 *   row; onClick receives the row. buildAriaLabel(row) should name the row so screen readers can tell
 *   identical buttons apart. isAvailable(row) hides the button on rows it cannot act on, so a refused
 *   action is never offered in the first place.
 * @param {string} props.caption - Accessible table description.
 * @returns {import('react').JSX.Element} The table.
 */
export default function DataTable({
  columns,
  rows,
  getRowKey = (tableRow) => tableRow.id,
  isLoading = false,
  errorMessage,
  onRetry,
  emptyTitle = 'Nothing to show yet',
  emptyMessage,
  rowActions = [],
  caption,
}) {
  if (errorMessage) {
    return (
      <div className="card">
        <ErrorState message={errorMessage} onRetry={onRetry} />
      </div>
    );
  }
  if (!isLoading && rows.length === 0) {
    return (
      <div className="card">
        <EmptyState title={emptyTitle} message={emptyMessage} />
      </div>
    );
  }

  const hasRowActions = rowActions.length > 0;
  const skeletonRowNumbers = Array.from({ length: SKELETON_ROW_COUNT }, (_unused, rowNumber) => rowNumber);

  return (
    <div className="card data-table__wrapper">
      <table className="data-table" aria-busy={isLoading}>
        <caption className="text-caption text-muted">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.header}
              </th>
            ))}
            {hasRowActions && <th scope="col">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? skeletonRowNumbers.map((rowNumber) => (
                <tr key={`skeleton-${rowNumber}`}>
                  {columns.map((column) => (
                    <td key={column.key}>
                      <div className="skeleton-line" />
                    </td>
                  ))}
                  {hasRowActions && <td />}
                </tr>
              ))
            : rows.map((tableRow) => (
                <tr key={getRowKey(tableRow)}>
                  {columns.map((column) => (
                    <td key={column.key}>{renderTableCell(column, tableRow)}</td>
                  ))}
                  {hasRowActions && (
                    <td>
                      <div className="data-table__actions">
                        {rowActions
                          .filter(
                            (rowAction) => !rowAction.isAvailable || rowAction.isAvailable(tableRow)
                          )
                          .map((rowAction) => (
                            <Button
                              key={rowAction.label}
                              label={rowAction.label}
                              icon={rowAction.icon}
                              size="small"
                              variant={rowAction.variant || 'text'}
                              ariaLabel={
                                rowAction.buildAriaLabel
                                  ? rowAction.buildAriaLabel(tableRow)
                                  : undefined
                              }
                              onClick={() => rowAction.onClick(tableRow)}
                            />
                          ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
