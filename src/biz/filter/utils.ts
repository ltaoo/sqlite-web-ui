import { TableCore, TableWithColumns } from "@/domains/ui/table/table";

import { FilterInput } from "./index";

export function buildQuerySQL(table: TableCore, inputs: FilterInput[], tables: TableWithColumns[]) {
  console.log("[BIZ]filter/utils - buildQuerySQL", inputs);
  const { name } = table;
  let query = `SELECT \`${name}\`.* FROM \`${name}\``;

  let prevJoin: FilterInput | null = null;
  let prevCondition: FilterInput | null = null;
  let prevField: FilterInput | null = null;

  let i = 0;
  while (i < inputs.length) {
    const input = inputs[i];
    (() => {
      if (input.type === "join") {
        const column = input.column;
        if (column) {
          const referenceTableName = input.value;
          const table = tables.find((t) => t.name === referenceTableName);
          if (table) {
            const primary = table.columns.find((col) => col.is_primary_key);
            if (primary) {
              query += ` JOIN \`${input.value}\` ON \`${input.value}\`.\`${primary.name}\` = \`${name}\`.\`${column.name}\``;
              prevJoin = input;
            }
          }
        }
        return;
      }
      if (input.type === "field") {
        prevField = input;
        if (prevJoin) {
          if (prevJoin.type === "join") {
            query += ` WHERE \`${prevJoin.value}\`.\`${input.value}\``;
          }
          prevJoin = null;

          return;
        }
        query += ` WHERE \`${input.value}\``;
        return;
      }
      if (input.type === "condition") {
        prevCondition = input;
        query += ` ${input.value}`;
        return;
      }
      if (input.type === "value") {
        const condition = prevCondition;
        prevCondition = null;
        const str = [];
        if (prevField) {
          if (prevField.column?.type === "text") {
            str.push("'");
          }
        }
        if (condition?.value === "LIKE") {
          str.push(`%`);
        }
        str.push(input.value);
        if (condition?.value === "LIKE") {
          str.push(`%`);
        }
        if (prevField) {
          if (prevField.column?.type === "text") {
            str.push("'");
          }
        }
        query += " " + str.join("");
        prevField = null;
      }
    })();
    i += 1;
  }

  return query;
}
