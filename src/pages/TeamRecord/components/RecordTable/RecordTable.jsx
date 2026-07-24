import styles from "./RecordTable.module.css";

const RecordTable = ({ columns, rows, getRowKey, ariaLabel }) => {
  return (
    <div className={styles.tableShell}>
      <table className={styles.table} aria-label={ariaLabel}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`${styles.headerCell} ${
                  column.align ? styles[`align${column.align}`] : ""
                }`}
                scope="col"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)} className={styles.row}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`${styles.bodyCell} ${
                    column.align ? styles[`align${column.align}`] : ""
                  }`}
                >
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecordTable;
