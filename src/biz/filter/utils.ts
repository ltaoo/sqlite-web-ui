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
export function buildORMObject(table: TableCore, rows: FilterInput[][], tables: TableWithColumns[]) {
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
/**
 * @todo 如果存在多个 WHERE 子句，需要按顺序使用 ()，比如 name = 'Friends' OR name = 'Break.Girls' AND order_num = 2
 * 预期是找出 名称等于Friends或Girls 的，在这个基础上，再筛选 order_num等于2。实际上的结果，是 name等于Friends的所有记录，或name等于Girls并且order_num等于2
 * 所以筛选出的记录数会更多。需要使用 (name = 'Friends' OR name = 'Break.Girls') AND order_num = 2
 *
 * 应该先构建出一个元对象，再根据元对象生成 SQL 语句
 * 因为在构建 SQL 语句过程中，后面的选项或值，会影响前面已构建的内容
 * 但元对象可以随意修改。其实这就是 ORM，比如 prisma.findFirst({ where: { name: { contain: 'Friends' }} })
 */
export function buildQuerySQL(table: TableCore, inputs: FilterInput[][], tables: TableWithColumns[]) {
  const { name } = table;
  let query = `SELECT \`${name}\`.* FROM \`${name}\``;
  // const last = inputs[inputs.length - 1];
  // if (!last) {
  //   return query;
  // }
  // if (last.type !== "value") {
  //   return query;
  // }

  // let prevJoin: FilterInput | null = null;
  // let prevCondition: FilterInput | null = null;
  // let prevField: FilterInput | null = null;

  // let i = 0;
  // while (i < inputs.length) {
  //   const input = inputs[i];
  //   (() => {
  //     console.log(i, input.type, input.column?.name, input.column?.references);
  //     if (input.type === "join") {
  //       const column = input.column;
  //       if (column) {
  //         const referenceTableName = input.value;
  //         const referencedTable = tables.find((t) => t.name === referenceTableName);
  //         // console.log("find referenced table", referencedTable, referenceTableName,  tables);
  //         if (referencedTable) {
  //           const primaryColumn = referencedTable.columns.find((col) => col.is_primary_key);
  //           console.log(
  //             "find primary column in referenced table",
  //             primaryColumn?.name,
  //             primaryColumn?.references
  //             // prevJoin
  //           );
  //           if (primaryColumn) {
  //             if (prevJoin) {
  //               query += ` JOIN \`${input.value}\` ON \`${input.value}\`.\`${primaryColumn.name}\` = \`${prevJoin.column?.references}\`.\`${column.name}\``;
  //               prevJoin = input;
  //               return;
  //             }
  //             query += ` JOIN \`${input.value}\` ON \`${input.value}\`.\`${primaryColumn.name}\` = \`${name}\`.\`${column.name}\``;
  //             prevJoin = input;
  //           }
  //         }
  //       }
  //       return;
  //     }
  //     if (input.type === "field") {
  //       prevField = input;
  //       if (prevJoin) {
  //         if (prevJoin.type === "join") {
  //           query += ` WHERE \`${prevJoin.value}\`.\`${input.value}\``;
  //         }
  //         prevJoin = null;

  //         return;
  //       }
  //       query += ` WHERE \`${input.value}\``;
  //       return;
  //     }
  //     if (input.type === "condition") {
  //       prevCondition = input;
  //       query += ` ${input.value}`;
  //       return;
  //     }
  //     if (input.type === "value") {
  //       const condition = prevCondition;
  //       prevCondition = null;
  //       const str = [];
  //       if (prevField) {
  //         if (prevField.column?.type === "text") {
  //           str.push("'");
  //         }
  //       }
  //       if (condition?.value === "LIKE") {
  //         str.push(`%`);
  //       }
  //       str.push(input.value);
  //       if (condition?.value === "LIKE") {
  //         str.push(`%`);
  //       }
  //       if (prevField) {
  //         if (prevField.column?.type === "text") {
  //           str.push("'");
  //         }
  //       }
  //       query += " " + str.join("");
  //       prevField = null;
  //     }
  //   })();
  //   i += 1;
  // }

  return query;
}
