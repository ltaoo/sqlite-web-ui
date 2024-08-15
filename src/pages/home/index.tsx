import { createSignal, For, JSX, onMount, Show } from "solid-js";
import { Calendar, CaseLower, Check, Hash, Settings } from "lucide-solid";

import { ViewComponent, ViewComponentProps } from "@/store/types";
import { request } from "@/biz/requests";
import { base, Handler } from "@/domains/base";
import { RequestCore } from "@/domains/request";
import { Response } from "@/domains/list/typing";
import { Select } from "@/components/ui/select";
import { InputCore, PopoverCore, SelectCore } from "@/domains/ui";
import { Input, Popover } from "@/components/ui";
import { TableRowCore } from "@/domains/ui/table/row";
import { TableCellCore } from "@/domains/ui/table/cell";
import { TableCore, TableWithColumns } from "@/domains/ui/table/table";
import { TableColumn, TableColumnCore } from "@/domains/ui/table/column";
import { DEFAULT_RESPONSE } from "@/domains/list/constants";

function fetchTableList() {
  return request.post<TableWithColumns[]>("/api/v1/database/tables");
}
function execQueryRaw(params: { query: string }) {
  return request.post("/api/v1/database/exec", params);
}

function TableFilterCore(props: {
  columns: {}[];
  table: { name: string; columns: {}[] };
  onSearch?: (values: {}[]) => void;
}) {
  const values: (string | null)[] = [];
  const select1 = new SelectCore<string>({
    defaultValue: "",
    options: [],
    onChange(v) {
      console.log("[PAGE]Filter onChange");
      values[0] = v;
      const condition1 = new SelectCore({
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
        ],
        onChange(v) {
          values[1] = v;
        },
      });
      values[1] = condition1.value;
      const input1 = new InputCore({
        defaultValue: "",
        onChange(v) {
          values[2] = v;
        },
        onBlur() {
          if (props.onSearch) {
            props.onSearch(values.filter(Boolean) as string[]);
          }
        },
        onEnter() {
          if (props.onSearch) {
            props.onSearch(values.filter(Boolean) as string[]);
          }
        },
      });
      values[2] = input1.value;
      builder[1] = condition1;
      builder[2] = input1;
      emitter.emit(Events.Change, [...builder]);
    },
  });
  let builder: (SelectCore<string> | InputCore<string>)[] = [select1];
  enum Events {
    Change,
  }
  type TheTypesOfEvents = {
    [Events.Change]: typeof builder;
  };
  const emitter = base<TheTypesOfEvents>();
  return {
    setOptions(options: { label: string; value: string }[]) {
      builder = [select1];
      select1.setOptionsForce(options);
      emitter.emit(Events.Change, [...builder]);
    },
    builder,
    onChange(handler: Handler<TheTypesOfEvents[Events.Change]>) {
      emitter.on(Events.Change, handler);
    },
  };
}
function SqliteDatabasePageCore(props: ViewComponentProps) {
  const { app } = props;

  const response = {
    ...DEFAULT_RESPONSE,
    pageSize: 100,
  };
  const $request = {
    tableList: new RequestCore(fetchTableList),
    exec: new RequestCore(execQueryRaw),
  };
  function buildColumns(columns: TableWithColumns["columns"]) {
    const base = columns.map((column, i) => {
      const { cid, name, type, not_null, value, pk } = column;
      const r = new TableColumnCore({
        x: i,
        type: (() => {
          if (type === "TEXT") {
            return "text";
          }
          if (type === "datetime") {
            return "calendar";
          }
          if (type === "INTEGER") {
            return "numeric";
          }
          return "text";
        })(),
        title: name,
        width: 200,
        options: (() => {
          if (type === "datetime") {
            return {
              format: "YYYY-MM-DD",
            };
          }
          return {};
        })(),
      });
      return r;
    });
    return [...base];
  }
  function renderTable(dataSource: string[][], columns: TableColumn[], response: Response<any>) {
    return dataSource.map((row, index) => {
      const y = index + (response.page - 1) * response.pageSize;
      const cells = [
        new TableCellCore({
          x: 0,
          y,
          value: String(y + 1),
          disabled: true,
          type: "index",
          $table,
        }),
      ].concat(
        row.map(
          (cell, i) =>
            new TableCellCore({
              x: i + 1,
              y,
              value: cell as string,
              width: columns[i].width,
              $table,
              onSelect(ins) {
                console.log("[PAGE]sqlite/index - in onSelect callback", curCell);
                if (curCell !== null) {
                  curCell.unselect();
                  curCell.unedit();
                }
                curCell = ins;
              },
              onUpdate(opt) {
                const { x, y, value } = opt;
                const column = $table.columns[x];
                if (!column) {
                  return;
                }
                const first = $table.columns[1];
                if (!first) {
                  return;
                }
                const name = $table.name;
                if (!name) {
                  return;
                }
                const id = row[0];
                const sql = `UPDATE ${name} SET ${column.title} = '${value}' WHERE ${first.title} = '${id}';`;
                console.log(sql);
              },
            })
        )
      );
      // for (let i = 0; i < cells.length; i += 1) {
      //   const cell = cells[i];
      //   cell.width = columns[i].width;
      // }
      const $row = new TableRowCore({ index: y, cells });
      return $row;
    });
  }

  const $table = new TableCore({});
  const $filter = TableFilterCore({
    columns: [],
    table: { name: "", columns: [] },
    async onSearch(values) {
      response.page = 1;
      response.noMore = false;
      response.loading = true;
      response.search.values = values;
      emitter.emit(Events.ResponseChange, { ...response });
      const { name, columns } = $table;
      const [field1, condition1, value1] = values;
      const column = columns.find((col) => col.title === field1);
      console.log("column", column);
      let sql = `SELECT * FROM ${name} WHERE ${field1} ${condition1} ${(() => {
        if (condition1 === "LIKE") {
          return `'%${value1}%'`;
        }
        if (column?.type === "numeric") {
          return value1;
        }
        return `'${value1}'`;
      })()} LIMIT ${response.pageSize} OFFSET ${(response.page - 1) * response.pageSize};`;
      console.log(field1, condition1, value1);
      console.log(sql);
      const r = await $request.exec.run({ query: sql });
      response.loading = false;
      emitter.emit(Events.ResponseChange, { ...response });
      if (r.error) {
        app.tip({
          text: [r.error.message],
        });
        return;
      }
      const dataSource = r.data as string[][] | null;
      if (dataSource === null) {
        response.noMore = true;
        $table.setData([]);
        $table.setRows([]);
        $table.refresh();
        emitter.emit(Events.ResponseChange, { ...response });
        return;
      }
      if (dataSource.length < response.pageSize) {
        response.noMore = true;
        emitter.emit(Events.ResponseChange, { ...response });
      }
      const rows = renderTable(dataSource, $table.columns, response);
      $table.setData(dataSource);
      $table.setRows(rows);
      $table.refresh();
    },
  });
  enum Events {
    ResponseChange,
  }
  type TheTypesOfEvents = {
    [Events.ResponseChange]: Response<string[]>;
  };
  const emitter = base<TheTypesOfEvents>();
  let _curTable: null | string = null;
  let curCell: TableCellCore | null = null;
  let _rows: TableCellCore[][] = [];
  let _keycodes = {
    ShiftLeft: false,
  };

  return {
    $request,
    get curTable() {
      return _curTable;
    },
    init: false,
    ui: {
      $table,
      $filter,
    },
    rows: _rows,
    keycodes: _keycodes,
    response,
    ready() {
      $request.tableList.run();
      const el = document.getElementById("spreadsheet") as HTMLDivElement;
      if (!el) {
        return;
      }
    },
    async handleClickTable(table: TableWithColumns) {
      response.page = 1;
      response.loading = true;
      response.noMore = false;
      response.search.values = null;
      emitter.emit(Events.ResponseChange, { ...response });
      const columns = buildColumns(table.columns);
      $filter.setOptions(
        columns.map((column) => {
          return {
            label: column.title,
            value: column.title,
          };
        })
      );
      const r = await $request.exec.run({
        query: `SELECT * FROM ${table.name} LIMIT ${response.pageSize} OFFSET ${
          (response.page - 1) * response.pageSize
        }`,
      });
      response.loading = false;
      emitter.emit(Events.ResponseChange, { ...response });
      if (r.error) {
        app.tip({
          text: [r.error.message],
        });
        return;
      }
      const dataSource = r.data as string[][] | null;
      if (dataSource === null) {
        response.noMore = true;
        $table.setRows([]);
        $table.setData([]);
        $table.refresh();
        emitter.emit(Events.ResponseChange, { ...response });
        return;
      }
      if (dataSource.length < response.pageSize) {
        response.noMore = true;
        emitter.emit(Events.ResponseChange, { ...response });
      }
      const rows = renderTable(dataSource, columns, response);
      const previewColumns = [
        new TableColumnCore({
          type: "index",
          title: "index",
          x: 0,
          width: 200,
          options: {},
        }),
        ...columns,
      ].map((c, i) => {
        c.x = i;
        return c;
      });
      $table.name = table.name;
      $table.setColumns(previewColumns);
      $table.setRows(rows);
      $table.setData(dataSource);
      $table.refresh();
    },
    cancelPendingUpdate() {
      const pending = $table.state.pendingUpdate;
      if (pending.length === 0) {
        return;
      }
      for (let i = 0; i < pending.length; i += 1) {
        const cell = pending[i];
        cell.cancelUpdate();
      }
    },
    async execPendingUpdate() {
      const pending = $table.state.pendingUpdate;
      // console.log('[PAGE]sqlite - pending')
      if (pending.length === 0) {
        return;
      }
      for (let i = 0; i < pending.length; i += 1) {
        await (async () => {
          const opt = pending[i];
          const { x, y, value } = opt;
          const { name, columns, data } = $table;
          const column = columns[x];
          if (!column) {
            return;
          }
          const first = columns[1];
          if (!first) {
            return;
          }
          if (!name) {
            return;
          }
          const id = data[y][0];
          const sql = `UPDATE ${name} SET ${column.title} = '${value}' WHERE ${first.title} = '${id}';`;
          console.log(sql);
          const r = await $request.exec.run({ query: sql });
          if (r.error) {
            app.tip({
              text: [r.error.message],
            });
            return;
          }
          pending[i].completeUpdate();
        })();
      }
    },
    async removeSelectedRows() {
      const { name, columns, data, selectedRows } = $table;
      const first = columns[1];
      if (!first) {
        return;
      }
      const sql = `DELETE FROM ${name} WHERE ${first.title} IN (${selectedRows
        .map((i) => {
          return data[i][0];
        })
        .join(", ")});`;
      console.log("sql", sql);
      const r2 = await $request.exec.run({ query: sql });
      if (r2.error) {
        app.tip({
          text: [r2.error.message],
        });
        return;
      }
      const nextData = data.filter((row, i) => !selectedRows.includes(i));
      $table.cells = $table.cells.filter((cell) => {
        return !selectedRows.includes(cell.y);
      });
      const rows = $table.rows.filter((row, i) => !selectedRows.includes(i));
      $table.setData(nextData);
      $table.setRows(rows);
      $table.clearSelectedRows();
    },
    async loadMore() {
      console.log("[PAGE]loadMore", response.loading, response.noMore);
      const name = $table.name;
      if (response.loading) {
        return;
      }
      if (response.noMore) {
        return;
      }
      response.page += 1;
      response.loading = true;
      emitter.emit(Events.ResponseChange, { ...response });
      const { values } = response.search;
      let condition = "";
      if (values) {
        const [field1, condition1, value1] = values as string[];
        const column = $table.columns.find((col) => col.title === field1);
        condition = ` WHERE ${field1} ${condition1} ${(() => {
          if (condition1 === "LIKE") {
            return `'%${value1}%'`;
          }
          if (column?.type === "numeric") {
            return value1;
          }
          return `'${value1}'`;
        })()}`;
      }
      const r = await $request.exec.run({
        query: `SELECT * FROM ${name}${condition} LIMIT ${response.pageSize} OFFSET ${
          (response.page - 1) * response.pageSize
        };`,
      });
      response.loading = false;
      emitter.emit(Events.ResponseChange, { ...response });
      if (r.error) {
        app.tip({
          text: [r.error.message],
        });
        return;
      }
      const dataSource = r.data as string[][] | null;
      if (dataSource === null) {
        $table.appendRows([]);
        $table.appendData([]);
        $table.refresh();
        response.noMore = true;
        emitter.emit(Events.ResponseChange, { ...response });
        return;
      }
      if (dataSource.length < response.pageSize) {
        response.noMore = true;
        emitter.emit(Events.ResponseChange, { ...response });
      }
      const rows = renderTable(dataSource, $table.columns, response);
      $table.appendRows(rows);
      $table.appendData(dataSource);
      $table.refresh();
    },
    onResponseChange(handler: Handler<TheTypesOfEvents[Events.ResponseChange]>) {
      return emitter.on(Events.ResponseChange, handler);
    },
  };
}
function ColumnTypeTag(props: { type: TableColumn["type"] }) {
  const { type } = props;
  if (type === "numeric") {
    // return <CaseLower class="w-4 h-4" />;
    return <div>num</div>;
  }
  if (type === "text") {
    return <Hash class="w-4 h-4" />;
  }
  if (type === "calendar") {
    return <Calendar class="w-4 h-4" />;
  }
  if (type === "index") {
    return null;
  }
  return null;
}
function TableColumnCell(props: { store: TableColumnCore }) {
  const { store } = props;

  const [state, setState] = createSignal(store.state);
  store.onChange((v) => setState(v));

  return (
    <div
      class="relative inline-block p-2 h-full truncate bg-[#f3f3f3]"
      // data-x={store.x}
      data-width={state().width}
      style={{
        border: "1px solid #ccc",
        width: state().width ? `${state().width}px` : "auto",
      }}
    >
      {state().title}
      <div class="absolute right-4 top-1/2 ml-4 -translate-y-1/2">
        <ColumnTypeTag type={state().type} />
      </div>
    </div>
  );
}
function TableCell(props: {
  store: TableCellCore;
  $page: ReturnType<typeof SqliteDatabasePageCore>;
  hasCheck?: boolean;
}) {
  const { store, $page } = props;

  let timer: NodeJS.Timeout | null = null;
  const CLICK_DELAY = 250;

  const [state, setState] = createSignal(store.state);
  store.onChange((v) => {
    console.log("handler change", v.width);
    setState(v);
  });

  return (
    <div
      class="__a inline-block relative p-2 h-full overflow-hidden truncate"
      style={{
        border: "1px solid #ccc",
        "user-select": "none",
        "border-color": state().selected ? "blue" : "#ccc",
        width: `${state().width}px`,
        "background-color": state().waitUpdate ? "yellow" : "unset",
      }}
      data-x={store.x}
      data-y={store.y}
      onClick={() => {
        store.select();
        console.log("", store.type, store.x, store.y);
        (() => {
          if (store.type === "index") {
            if ($page.keycodes.ShiftLeft) {
              // const firstSelect = Math.min.apply(null, $table.rows);
              const prev = $page.ui.$table.selectedRows[$page.ui.$table.selectedRows.length - 1] || 0;
              console.log("multiple select", prev, store.y);
              if (prev !== store.y) {
                const [max, min] = [Math.max(prev, store.y), Math.min(prev, store.y)];
                for (let i = min + 1; i <= max; i += 1) {
                  $page.ui.$table.selectRow(i);
                }
              }
              return;
            }
            $page.ui.$table.selectRow(store.y);
          }
        })();
        if (timer) {
          clearTimeout(timer);
          timer = null;
          store.edit();
        } else {
          timer = setTimeout(() => {
            timer = null;
          }, CLICK_DELAY);
        }
      }}
    >
      <Show
        when={!state().editing}
        fallback={
          <input
            class="__a w-full h-full"
            value={state().value as string}
            style={{ width: `${store.width - 16}px` }}
            onChange={(event) => {
              const value = event.currentTarget.value;
              store.inputValue = value;
            }}
            onAnimationEnd={(event) => {
              event.currentTarget.focus();
            }}
            onBlur={() => {
              if (store.inputValue === store.value) {
                return;
              }
              store.updateValue();
            }}
          />
        }
      >
        {state().value as string}
        <Show when={props.hasCheck}>
          <Check class="absolute right-0 top-1/2 w-4 h-4 transform -translate-y-1/2" />
        </Show>
      </Show>
    </div>
  );
}

export const SqliteDatabasePage: ViewComponent = (props) => {
  const { storage } = props;
  const $page = SqliteDatabasePageCore(props);
  const $request = $page.$request;
  const $settings = new PopoverCore({});

  const [tables, setTables] = createSignal($request.tableList.response);
  const [response, setResponse] = createSignal($page.response);
  const [table, setTable] = createSignal($page.ui.$table.state);
  // const [dataSource, setDataSource] = createSignal<TableCellCore[][]>([]);
  // const [columns, setColumns] = createSignal<{ title: string; width: number }[]>([]);
  const [filter, setFilter] = createSignal($page.ui.$filter.builder);
  const [left, setLeft] = createSignal(0);

  let $head: HTMLDivElement;

  $request.tableList.onResponseChange((v) => {
    const prev = storage.get("column_widths");
    if (v === null) {
      return;
    }
    for (let i = 0; i < v.length; i += 1) {
      const t = v[i];
      for (let j = 0; j < t.columns.length; j += 1) {
        const column = t.columns[j];
        const w = prev[column.name] || 200;
        column.width = w;
      }
    }
    setTables(v);
  });
  $page.ui.$table.onChange((v) => {
    return setTable(v);
  });
  $page.ui.$filter.onChange((v) => {
    setFilter(v);
  });
  $page.onResponseChange((v) => setResponse(v));

  onMount(() => {
    document.addEventListener("keydown", (event) => {
      if (event.code === "ShiftLeft") {
        $page.keycodes.ShiftLeft = true;
      }
    });
    document.addEventListener("keyup", (event) => {
      if (event.code === "ShiftLeft") {
        $page.keycodes.ShiftLeft = false;
      }
    });
    $page.ready();
  });

  return (
    <div>
      <div class="flex">
        <div class="overflow-y-auto p-4 w-[236px] h-screen">
          <div class="space-y-2">
            <For each={tables()}>
              {(t) => {
                return (
                  <div
                    classList={{
                      "flex items-center justify-between px-4 py-2 rounded-md bg-white cursor-pointer truncate": true,
                      underline: t.name === table().name,
                    }}
                    onClick={() => {
                      $page.handleClickTable(t);
                    }}
                  >
                    <div class="overflow-hidden truncate">{t.name}</div>
                    <div
                      class="ml-2"
                      onClick={(event) => {
                        event.stopPropagation();
                        const { pageX, pageY } = event;
                        $settings.show({
                          x: pageX,
                          y: pageY,
                        });
                      }}
                    >
                      <Settings class="w-4 h-4 cursor-pointer" />
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
        <div class="relative flex flex-col flex-1 w-0 h-screen overflow-auto">
          <div class="flex items-center justify-between py-2 pr-8">
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-2">
                <For each={filter()}>
                  {(filter) => {
                    if (filter instanceof SelectCore) {
                      return <Select store={filter} />;
                    }
                    if (filter instanceof InputCore) {
                      return <Input store={filter} />;
                    }
                    return null;
                  }}
                </For>
              </div>
              <Show when={table().selectedRows.length}>
                <div
                  onClick={() => {
                    $page.removeSelectedRows();
                  }}
                >
                  删除{table().selectedRows.length}条记录
                </div>
              </Show>
              <Show when={table().pendingUpdate.length}>
                <div
                  class=""
                  onClick={() => {
                    $page.execPendingUpdate();
                  }}
                >
                  保存{table().pendingUpdate.length}个修改
                </div>
                <div
                  onClick={() => {
                    $page.cancelPendingUpdate();
                  }}
                >
                  放弃修改
                </div>
              </Show>
            </div>
          </div>
          <div
            class="thead h-[54px] w-full overflow-hidden"
            style={{
              // transform: "translateY(-42px)",
              height: "42px",
            }}
          >
            <div
              class="__a tr"
              style={{
                width: `${table().width}px`,
                height: "42px",
                transform: `translateX(${-left()})`,
              }}
              onAnimationEnd={(event) => {
                $head = event.currentTarget;
              }}
            >
              <For each={table().columns}>
                {(column) => {
                  return <TableColumnCell store={column} />;
                }}
              </For>
            </div>
          </div>
          <div
            class="__a overflow-y-auto flex-1 relative absolute top-0 bottom-0 h-screen"
            onScroll={(event) => {
              const { scrollTop, scrollLeft, clientHeight, offsetHeight } = event.currentTarget;
              $head.style.transform = `translateX(-${scrollLeft}px)`;
              setLeft(scrollLeft);
              // console.log("", scrollTop, clientHeight, offsetHeight);
              if (scrollTop + clientHeight >= $page.ui.$table.height - 200) {
                $page.loadMore();
              }
              $page.ui.$table.handleScroll({ scrollTop });
            }}
            // class=" absolute top-[36px] bottom-0 left-0 right-0"
            // onAnimationEnd={(event) => {
            //   if ($page.init) {
            //     return;
            //   }
            //   $page.init = true;
            //   const { clientWidth } = event.currentTarget;
            //   const autoColumns = $page.ui.$table.columns.filter((c) => c.width === 0);
            //   const widthColumns = $page.ui.$table.columns.filter((c) => c.width !== 0);
            //   const width = widthColumns.reduce((total, c) => c.width + total, 0);
            //   const ava = (clientWidth - width) / autoColumns.length;
            //   for (let i = 0; i < autoColumns.length; i += 1) {
            //     const column = autoColumns[i];
            //     column.stWidth(ava);
            //   }
            //   console.log($page.ui.$table.rows.length);
            //   for (let i = 0; i < $page.ui.$table.rows.length; i += 1) {
            //     const row = $page.ui.$table.rows[i];
            //     for (let j = 0; j < row.cells.length; j += 1) {
            //       const cell = row.cells[j];
            //       const column = $page.ui.$table.columns[j];
            //       cell.setWidth(column.width);
            //     }
            //   }
            // }}
          >
            <div
            // class="table __a overflow-auto absolute top-[82px] bottom-0 left-0 right-0"
            >
              {/* <colgroup>
                <For each={table().columns}>
                  {(column) => {
                    return <col width={column.width ? `${column.width}px` : "auto"}></col>;
                  }}
                </For>
              </colgroup> */}

              <div
                // class="tbody overflow-y-auto absolute bottom-0 left-0 right-4 bg-white"
                class="tbody overflow-y-auto absolute top-0 bottom-0 left-0 right-4 bg-white"
                style={{
                  position: "relative",
                  width: `${table().width}px`,
                  height: `${table().height}px`,
                  // "padding-top": "42px",
                }}
              >
                <div
                  style={{
                    transform: `translateY(${table().offsetTop}px)`,
                  }}
                >
                  <For each={table().visibleRows}>
                    {(row) => {
                      return (
                        <div
                          class=""
                          data-index={row.index}
                          style={{
                            width: `${table().width}px`,
                            height: "42px",
                          }}
                        >
                          <For each={row.cells}>
                            {(col, i) => {
                              return (
                                <TableCell
                                  store={col}
                                  $page={$page}
                                  hasCheck={col.type === "index" && table().selectedRows.includes(col.y)}
                                />
                              );
                            }}
                          </For>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </div>
              <Show when={response().noMore}>
                <div class="py-4 text-center">没有更多数据了</div>
              </Show>
            </div>
          </div>
        </div>
      </div>
      <Popover
        store={$settings}
        content={
          <div class="space-y-1">
            <div class="">
              <For each={table().columns}>
                {(column) => {
                  return (
                    <div class="flex items-center justify-between w-full">
                      <div>{column.title}</div>
                      <input
                        class="ml-4"
                        placeholder="输入宽度"
                        onBlur={(event) => {
                          const { value } = event.currentTarget;
                          if (value === "") {
                            return;
                          }
                          if (value.trim() === "") {
                            return;
                          }
                          const num = Number(value);
                          if (Number.isNaN(num)) {
                            return;
                          }
                          column.setWidth(num);
                          storage.setWithPrev("column_widths", (v) => {
                            return {
                              ...v,
                              [column.title]: num,
                            };
                          });
                          $page.ui.$table.setWidth();
                          for (let i = 0; i < $page.ui.$table.rows.length; i += 1) {
                            const row = $page.ui.$table.rows[i];
                            // console.log(column.title, column.width);
                            // const column = $page.ui.$table.columns[j];
                            const cell = row.cells[column.x];
                            cell.setWidth(column.width);
                          }
                        }}
                      />
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        }
      ></Popover>
    </div>
  );
};
