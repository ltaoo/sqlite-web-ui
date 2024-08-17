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
  onSearch?: (values: FilterInput[][]) => void;
}) {
  const { table, tables } = props;

  let _table = table;
  let _tables = tables;
  let _values: FilterInput[][] = [];
  let _baseColumns: TableColumn[] = [];

  const $submit = new ButtonCore({
    onClick() {
      if (props.onSearch) {
        props.onSearch(_values);
      }
    },
  });
  const $more = new ButtonCore({
    onClick() {
      const first = new FilterInput({
        type: "field",
        $input: new SelectCore<string>({
          defaultValue: "",
          options: buildOptions(_baseColumns),
          onChange(v) {
            const column = _table.columns.find((c) => c.name === v);
            first.column = column || null;
            _values[1] = _values[1].slice(0, 1);
            handleColumnSelectValueChange(v, [1, 0], first, _baseColumns);
          },
        }),
      });
      _values = [..._values, [first]];
      emitter.emit(Events.Change, [..._values]);
    },
  });

  /**
   * 这个方法仅提供给 Field 类型的 Input 使用
   * 选择不同列后，出现的 条件 和 值类型 就不同
   */
  function handleColumnSelectValueChange(
    v: string | null,
    index: [number, number],
    $input: FilterInput,
    columns: TableColumn[]
  ) {
    const [x, y] = index;
    $input.type = "field";
    (() => {
      // 第一步，先拿到选中值对应的 column。有一种情况，reference 不是真实存在的 column，是外键关联的表名
      // 如果选择了这种，就重复 handleColumnSelectValueChange 执行
      const column = columns.find((c) => c.name === v);
      const reference = columns.find((c) => c.references === v);

      // const [column, reference] = (() => {
      //   if (y === 0) {
      //     // 当前表，找到选择值的列
      //     // 普通字段查询
      //     const column = _table.columns.find((col) => col.name === v);
      //     // 这是表示需要 JOIN 查询，其实 reference 还是 TableColumnCore 类型
      //     const reference = _table.columns.find((col) => col.references === v);
      //     return [column, reference];
      //   }
      //   const cur = _values[x][y];
      //   if (cur) {
      //     const c = cur.column;
      //     if (c && c.references) {
      //       // 其实 prev 存在 column，就表示要 JOIN 查询了。这里拿到 JOIN 的表
      //       console.log("[BIZ]filter/index - before const table = _tables.find", c.references);
      //       if (table) {
      //         const column = table.columns.find((col) => col.name === v);
      //         const reference = table.columns.find((col) => col.references === v);
      //         return [column, reference];
      //       }
      //     }
      //   }
      //   return [null, null];
      // })();
      console.log("[BIZ]filter/index handleValueChange", v, index, { column, reference }, columns);
      if (reference) {
        const table = _tables.find((t) => t.name === reference.references);
        $input.type = "join";
        $input.column = reference;
        console.log("[BIZ]filter/index - before if (table", table, reference.references, _tables);
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
                handleColumnSelectValueChange(v, [x, y + 1], $sub, table.columns);
              },
            }),
          });
          // if (table.columns[0]) {
          //   $sub.$input.onMounted(() => {
          //     $sub.$input.setValue(table.columns[0].name);
          //   });
          // }
          _values[x] = [
            ..._values[x].slice(0, y + 1),
            // ...
            $sub,
          ];
          return;
        }
        return;
      }
      if (column) {
        if (column.type === "datetime") {
          _values[x] = [
            ..._values[x].slice(0, y + 1),
            new FilterInput({
              type: "condition",
              $input: new SelectCore({
                defaultValue: "<",
                options: [
                  {
                    label: "之前",
                    value: "<",
                  },
                  {
                    label: "之后",
                    value: ">",
                  },
                  {
                    label: "等于",
                    value: "=",
                  },
                  // {
                  //   label: "在这之间",
                  //   value: "BETWEEN",
                  // },
                ],
              }),
            }),
            new FilterInput({
              type: "value",
              $input: new InputCore({
                defaultValue: new Date(),
                type: "date",
                onEnter() {
                  $submit.click();
                },
              }),
            }),
          ];
          return;
        }
        if (column.type === "integer") {
          _values[x] = [
            ..._values[x].slice(0, y + 1),
            new FilterInput({
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
                  // {
                  //   label: "IN",
                  //   value: "IN",
                  // },
                  // BETWEEN 5 AND 10;
                  // {
                  //   label: "之间",
                  //   value: "BETWEEN",
                  // },
                ],
              }),
            }),
            new FilterInput({
              type: "value",
              $input: new InputCore({
                defaultValue: 0,
                onEnter() {
                  $submit.click();
                },
              }),
            }),
          ];
          return;
        }
      }
      _values[x] = [
        ..._values[x].slice(0, y + 1),
        new FilterInput({
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
              // 这个应该判断字段是否支持为空
              //     {
              //       label: "IS NULL",
              //       value: "IS NULL",
              //     },
            ],
          }),
        }),
        new FilterInput({
          type: "value",
          $input: new InputCore({
            defaultValue: "",
            onEnter() {
              $submit.click();
            },
          }),
        }),
      ];
      return;
    })();
    emitter.emit(Events.Change, [..._values]);
  }
  function buildOptions(columns: TableColumn[]) {
    const options: { label: string; value: string }[] = [];
    for (let j = 0; j < columns.length; j += 1) {
      const column = columns[j];
      const { name, type, references } = column;
      (() => {
        if (type === "index") {
          return;
        }
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
    // console.log("build options", options);
    return options;
  }

  enum Events {
    Change,
  }
  type TheTypesOfEvents = {
    [Events.Change]: typeof _values;
  };

  const emitter = base<TheTypesOfEvents>();
  return {
    get values() {
      return _values;
    },
    $submit,
    $more,
    setTable(table: TableWithColumns) {
      _table = table;
    },
    setTables(tables: TableWithColumns[]) {
      _tables = tables;
    },
    setOptions(columns: TableColumnCore[]) {
      _baseColumns = columns;
      const first = new FilterInput({
        type: "field",
        $input: new SelectCore<string>({
          defaultValue: "",
          options: buildOptions(columns),
          onChange(v) {
            const column = _table.columns.find((c) => c.name === v);
            first.column = column || null;
            _values[0] = _values[0].slice(0, 1);
            handleColumnSelectValueChange(v, [0, 0], first, columns);
          },
        }),
      });
      _values = [[first]];
      emitter.emit(Events.Change, [..._values]);
    },
    onChange(handler: Handler<TheTypesOfEvents[Events.Change]>) {
      emitter.on(Events.Change, handler);
    },
  };
}
