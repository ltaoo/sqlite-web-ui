import { base, BaseDomain, Handler } from "@/domains/base";
import { SelectCore, InputCore, ButtonCore } from "@/domains/ui";
import { TableColumn, TableColumnCore } from "@/domains/ui/table/column";
import { TableCore, TableWithColumns } from "@/domains/ui/table/table";

enum Events {
  Change,
}
type TheTypesOfBaseEvents = {
  [Events.Change]: {};
};
export class FilterInput extends BaseDomain<TheTypesOfBaseEvents> {
  type: "field" | "condition" | "value" | "join";
  //   value: string | number | null = "";
  column: TableColumn | null;

  $input: SelectCore<any> | InputCore<any>;

  constructor(props: {
    type: "field" | "condition" | "value" | "join";
    column?: TableColumn;
    $input: SelectCore<any> | InputCore<any>;
  }) {
    super(props);

    const { type, column = null, $input } = props;
    this.type = type;
    //     this.value = value;
    this.column = column;

    this.$input = $input;
  }
  get value() {
    return this.$input.value;
  }
  //   setValue(v: string | number | null) {
  //     this.$input = v;
  //   }
}
// function FilterInput(props: { type: "field" | "condition" | "value"; column?: TableColumn }) {
//   const { type, column } = props;

//   return {
//     type,
//     column,
//   };
// }

export function TableFilterCore(props: {
  table: TableWithColumns;
  tables: TableWithColumns[];
  onSearch?: (values: FilterInput[]) => void;
}) {
  const { table, tables } = props;

  let _table = table;
  let _tables = tables;

  const $submit = new ButtonCore({
    onClick() {
      if (props.onSearch) {
        props.onSearch(values);
      }
    },
  });

  function handleValueChange(v: string | null, index: number, $input: FilterInput) {
    $input.type = "field";
    const nextInputs: (SelectCore<any> | InputCore<any>)[] = (() => {
      let column = _table.columns.find((col) => col.name === v);
      let reference = _table.columns.find((col) => col.references === v);
      const prev = values[index - 1];
      //       if (prev) {
      //         const table = _tables.find((t) => t.name === $input.column?.references);
      //         if (table) {
      //           column = table.columns.find((col) => col.name === v);
      //           reference = table.columns.find((col) => col.references === v);
      //         }
      //       }
      // 解决多表 JOIN 查询
      console.log("[BIZ]filter/index - handleValueChange", index, v, column, reference, _table.columns);
      console.log("[PAGE]Filter onChange", v, index, column);
      if (reference) {
        const table = _tables.find((t) => t.name === reference.references);
        $input.type = "join";
        $input.column = reference;
        if (table) {
          const $sub = new FilterInput({
            type: "field",
            column,
            $input: new SelectCore({
              defaultValue: "",
              options: buildOptions(table.columns),
              onChange(v) {
                const column = table.columns.find((c) => c.name === v);
                $sub.column = column || null;
                handleValueChange(v, index + 1, $sub);
              },
            }),
          });
          if (table.columns[0]) {
            $sub.$input.onMounted(() => {
              $sub.$input.setValue(table.columns[0].name);
            });
          }
          values[index + 1] = $sub;
          return [];
        }
        return [];
      }
      if (column) {
        if (column.type === "datetime") {
          values[index + 1] = new FilterInput({
            type: "condition",
            $input: new SelectCore({
              defaultValue: "<",
              options: [
                {
                  label: "在这之前",
                  value: "<",
                },
                {
                  label: "在这之后",
                  value: ">",
                },
                {
                  label: "等于",
                  value: "=",
                },
                {
                  label: "在这之间",
                  value: "BETWEEN",
                },
              ],
            }),
          });
          values[index + 2] = new FilterInput({
            type: "value",
            $input: new InputCore({
              defaultValue: new Date(),
              type: "date",
              onEnter() {
                $submit.click();
              },
            }),
          });
          return [];
        }
        if (column.type === "integer") {
          values[index + 1] = new FilterInput({
            type: "condition",
            $input: new SelectCore({
              defaultValue: "<",
              options: [
                {
                  label: "小于",
                  value: "<",
                },
                {
                  label: "大于",
                  value: ">",
                },
                {
                  label: "等于",
                  value: "=",
                },
                {
                  label: "之间",
                  value: "BETWEEN",
                },
              ],
            }),
          });
          values[index + 2] = new FilterInput({
            type: "value",
            $input: new InputCore({
              defaultValue: 0,
              onEnter() {
                $submit.click();
              },
            }),
          });
          return [];
        }
      }
      values[index + 1] = new FilterInput({
        type: "condition",
        $input: new SelectCore({
          defaultValue: "=",
          options: [
            {
              label: "等于",
              value: "=",
            },
            {
              label: "包含",
              value: "LIKE",
            },
            {
              label: "不等于",
              value: "!=",
            },
            {
              label: "不包含",
              value: "NOT LIKE",
            },
          ],
        }),
      });
      values[index + 2] = new FilterInput({
        type: "value",
        $input: new InputCore({
          defaultValue: "",
          onEnter() {
            $submit.click();
          },
        }),
      });
      return [];
    })();
    //     nextInputs.onChange(() => {
    //       values[index + 1] = v;
    //     });
    //     values[index + 1] = nextInputs.value;
    //     const input1 = new InputCore({
    //       defaultValue: "",
    //       onChange(v) {
    //         values[2] = v;
    //       },
    //       onBlur() {
    //         if (props.onSearch) {
    //           props.onSearch(values.filter(Boolean) as string[]);
    //         }
    //       },
    //       onEnter() {
    //         if (props.onSearch) {
    //           props.onSearch(values.filter(Boolean) as string[]);
    //         }
    //       },
    //     });
    //     builder = [...builder.slice(0, index + 1), ...nextInputs];
    //     values = [...values.slice(0, index + 1)];
    //     values[2] = input1.value;
    //     builder[index + 2] = input1;
    // 为什么 values 会有 undefined 元素？
    emitter.emit(Events.Change, [...values]);
  }
  function buildOptions(columns: TableColumn[]) {
    const options: { label: string; value: string }[] = [];
    for (let j = 0; j < columns.length; j += 1) {
      const column = columns[j];
      const { name, type, references } = column;
      (() => {
        const base = {
          label: name,
          value: name,
        };
        if (references) {
          options.push(
            ...[
              base,
              {
                label: references,
                value: references,
              },
            ]
          );
          return;
        }
        options.push(base);
      })();
    }
    return options;
  }

  // const values: ReturnType<typeof FilterField>[] = [];

  let values: FilterInput[] = [];
  //   const baseSelect = ;
  //   let values: (string | number | null)[] = [];
  //   let builder: (SelectCore<string> | InputCore<string>)[] = [baseSelect];

  enum Events {
    Change,
  }
  type TheTypesOfEvents = {
    [Events.Change]: typeof values;
  };

  const emitter = base<TheTypesOfEvents>();
  return {
    //     builder,
    values,
    $submit,
    setTable(table: TableWithColumns) {
      _table = table;
    },
    setTables(tables: TableWithColumns[]) {
      _tables = tables;
    },
    setOptions(columns: TableColumnCore[]) {
      const first = new FilterInput({
        type: "field",
        $input: new SelectCore<string>({
          defaultValue: "",
          options: buildOptions(columns),
          onChange(v) {
            const column = _table.columns.find((c) => c.name === v);
            first.column = column || null;
            values = values.slice(0, 1);
            handleValueChange(v, 0, first);
          },
        }),
      });
      values = [first];
      emitter.emit(Events.Change, [...values]);
    },
    onChange(handler: Handler<TheTypesOfEvents[Events.Change]>) {
      emitter.on(Events.Change, handler);
    },
  };
}
