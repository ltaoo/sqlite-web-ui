import { TableCore, TableWithColumns } from "@/domains/ui/table/table";
import { MutableRecord2 } from "@/types";
import { TableColumn, TableColumnType } from "@/domains/ui/table/column";

import { FilterInput } from "./index";

type NestedStringFilter = {
  equals?: string;
  /** IN */
  in?: string[];
  /** NOT IN */
  notIn?: string[];
  /** 小于 */
  lt?: number;
  /** 小于等于 */
  lte?: number;
  /** 大于 */
  gt?: number;
  /** 大于等于 */
  gte?: number;
  /** 包含.. */
  contains?: string;
  /** 以..开头 */
  startsWith?: string;
  /** 以..结尾 */
  endsWith?: string;
  not?: NestedStringFilter;
};
type StringFilter = NestedStringFilter & {
  not?: NestedStringFilter;
};
type NestedIntFilter = {
  /** 等于 */
  equals?: string;
  /** IN */
  in?: number[];
  /** NOT IN */
  notIn?: number[];
  /** 小于 */
  lt?: number;
  /** 小于等于 */
  lte?: number;
  /** 大于 */
  gt?: number;
  /** 大于等于 */
  gte?: number;
  not?: NestedIntFilter;
};
type IntFilter = NestedIntFilter & {
  not?: NestedIntFilter;
};
// type ColumnCondition = MutableRecord2<{
//   [TableColumnType.Text]: {
//     contain?: string;
//     equal?: string;
//   };
//   [TableColumnType.Integer]: {
//     equal?: string;
//   };
//   [TableColumnType.DateTime]: {
//     equal?: string;
//   };
//   [TableColumnType.Index]: {};
//   [TableColumnType.Table]: {};
// }>;
type TableField = string;
type ReferenceTableQuery = {
  AND?: ReferenceTableQuery[];
  OR?: ReferenceTableQuery[];
} & Record<TableField, StringFilter | IntFilter>;
type TableQuery = {
  AND?: (TableQuery | ReferenceTableQuery)[];
  OR?: (TableQuery | ReferenceTableQuery)[];
} & Record<TableField, StringFilter | IntFilter | ReferenceTableQuery>;
// type TableQuery = Record<TableField, StringFilter | IntFilter | ReferenceTableQuery>;
// type TableQueryWithAndOr = {
//   AND?: TableQuery[];
//   OR?: TableQuery[];
// };
export function buildORMObject(table: TableWithColumns, rows: FilterInput[][], tables: TableWithColumns[]) {
  const { name } = table;
  const result: {
    name: string;
    // joins: Record<
    //   string,
    //   {
    //     name: string;
    //     condition: { field: string; value: string }[];
    //   }
    // >;
    where: TableQuery;
  } = {
    name,
    // joins: {},
    where: {},
  };
  const queries: TableQuery[] = [];
  for (let j = 0; j < rows.length; j += 1) {
    const inputs = rows[j].reverse();

    let prevJoin: FilterInput | null = null;
    let prevCondition: FilterInput | null = null;
    let prevField: FilterInput | null = null;
    // const prefix = inputs[0];

    let i = 0;
    let query: TableQuery = {};

    while (i < inputs.length) {
      const input = inputs[i];
      (() => {
        if (input.type === "value") {
          const condition = inputs[i + 1];
          const field = inputs[i + 2];
          const column = field.column;
          if (field.type === "field" && column) {
            query = {
              [column.references || column.name]: ((): StringFilter | IntFilter => {
                if (column.type === TableColumnType.Text) {
                  if (condition.value === "LIKE") {
                    return {
                      contains: input.value,
                    };
                  }
                  if (condition.value === "=") {
                    return {
                      equals: input.value,
                    };
                  }
                }
                if (column.type === TableColumnType.Integer) {
                  if (condition.value === ">") {
                    return {
                      gt: input.value,
                    };
                  }
                  if (condition.value === "=") {
                    return {
                      equals: input.value,
                    };
                  }
                  if (condition.value === "<") {
                    return {
                      lt: input.value,
                    };
                  }
                }
                return {};
              })(),
            };
          }
          i += 2;
          return;
        }
        const column = input.column;
        if (input.type === "field" && column) {
          // 到这里，就真的可能是联表查询了。因为在处理了 value、condition、field 三个后，还有 field
          const field = input;
          if (column.references) {
            query = {
              [column.references]: query,
            };
          }
          // const referencedTable = tables.find((t) => t.name === column.references);
          // if (referencedTable) {
          // }
          // return;
        }
        if (input.type === "multiple") {
          const prevQuery = queries.shift();
          if (input.value === "AND" && prevQuery) {
            // @ts-ignore
            query = {
              AND: [prevQuery, query],
            };
            return;
          }
          if (input.value === "OR" && prevQuery) {
            // @ts-ignore
            query = {
              OR: [prevQuery, query],
            };
            return;
          }
        }
      })();
      // console.log(query);
      i += 1;
    }
    queries.push(query);
  }
  if (queries.length === 1) {
    result.where = queries[0];
  }
  return result;
}
function buildSQLFromORM(
  table: TableWithColumns,
  where: TableQuery,
  tables: { name: string; columns: TableColumn[] }[]
) {
  const joins: {
    table: string;
    primary_key: string;
    reference: {
      table: string;
      primary_key: string;
    };
  }[] = [];

  function buildCondition(key: string, condition: StringFilter | IntFilter, reference: TableWithColumns) {
    // console.warn("[BIZ]filter/utils - buildCondition", key, condition, reference);
    const column = reference.columns.find((col) => col.name === key);
    if (!column) {
      console.warn("unexpected", key, condition, reference);
      return "";
    }
    let part = `\`${reference.name}\`.`;
    const operator = Object.keys(condition)[0];
    // @ts-ignore
    const value = condition[operator];
    if (value === undefined) {
      return part;
    }
    const v = column.type === TableColumnType.Text ? `'${value}'` : value;
    // console.log(key, operator, v);
    (() => {
      if (operator === "equals") {
        part += `\`${key}\` = ${v}`;
        return;
      }
      if (operator === "in") {
        return;
      }
      if (operator === "notIn") {
        return;
      }
      if (operator === "lt") {
        part += `\`${key}\` < ${v}`;
        return;
      }
      if (operator === "lte") {
        return;
      }
      if (operator === "gt") {
        return;
      }
      if (operator === "gte") {
        return;
      }
      if (operator === "endsWith") {
        part += `\`${key}\` LIKE '${value}%'`;
        return;
      }
      if (operator === "startsWith") {
        part += `\`${key}\` LIKE '%${value}'`;
        return;
      }
      if (operator === "contains") {
        part += `\`${key}\` LIKE '%${value}%'`;
        return;
      }
      if (operator === "not") {
        return;
      }
    })();
    return part;
  }
  function queryToString(query: TableQuery | ReferenceTableQuery, reference: TableWithColumns) {
    // console.log("invoke queryToString", query);
    const keys = Object.keys(query);
    let result = "";
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      (() => {
        const value = query[key];
        if (!value) {
          return;
        }
        if (key === "AND") {
          const parts = (value as TableQuery[])
            .map((v) => {
              return queryToString(v, reference);
            })
            .filter(Boolean);
          // console.log("before parts.join(AND)", parts);
          result += parts.length > 1 ? `(${parts.join(" AND ")})` : parts[0];
          return;
        }
        if (key === "OR") {
          const parts = (value as TableQuery[])
            .map((v) => {
              return queryToString(v, reference);
            })
            .filter(Boolean);
          // console.log("before parts.join(OR)", parts);
          result += parts.length > 1 ? `(${parts.join(" OR ")})` : parts[0];
          return;
        }
        const table = tables.find((t) => t.name === key);
        // const sub = queryToString(v);
        if (table) {
          const primary = table.columns.find((column) => column.is_primary_key);
          const foreign = reference.columns.find((column) => column.references === key);
          // console.log("is JOIN", key, value, table, primary, reference.columns, foreign);
          if (primary && foreign) {
            // 这里还是暂时存到对象，万一重复 JOIN 同一张表，代码就奇怪了
            const existing = joins.find((t) => t.table === table.name);
            if (!existing) {
              joins.push({
                table: table.name,
                primary_key: primary.name,
                reference: {
                  table: reference.name,
                  // primary_key: reference.columns.find((c) => c.is_primary_key)!.name,
                  primary_key: foreign.name,
                  // primary_key: "id",
                },
              });
            }
          }
          result += queryToString(value, table);
          return;
        }
        // 字段
        const part = buildCondition(key, value as StringFilter | IntFilter, reference);
        // console.log(part);
        result += part;
        // const condition: (keyof typeof value)[number] = Object.keys(value)[0];
        // @ts-ignore
        // const v = value[condition];
        // console.log("the value is object")
        // if (condition) {
        //   (() => {})();
        // }
      })();
    }
    return result;
  }
  // return `SELECT * FROM \`${table_name}\` WHERE ${queryToString(where)}`;
  // return ` WHERE ${queryToString(where)}`;
  const condition = queryToString(where, table);
  let result = "";
  // console.log("joins", joins);
  for (let i = 0; i < joins.length; i += 1) {
    const { table, primary_key, reference } = joins[i];
    result += ` JOIN \`${table}\` ON \`${table}\`.\`${primary_key}\` = \`${reference.table}\`.\`${reference.primary_key}\``;
  }
  return result + (condition ? ` WHERE ${condition}` : "");
}
/**
 * 根据表单值，构建 SQL 语句
 */
export function buildQuerySQL(table: TableWithColumns, inputs: FilterInput[][], tables: TableWithColumns[]) {
  const { name } = table;
  let query = `SELECT \`${name}\`.* FROM \`${name}\``;
  const orm = buildORMObject(table, inputs, tables);
  const where = buildSQLFromORM(table, orm.where, tables);
  return query + where;
}
