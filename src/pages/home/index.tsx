/**
 * @file 数据库管理
 */
import { createSignal, For, onMount, Show } from "solid-js";
import { Calendar, Check, Hash, Settings } from "lucide-solid";

import { ViewComponent, ViewComponentProps } from "@/store/types";
import { base, Handler } from "@/domains/base";
import { RequestCore } from "@/domains/request";
import { Response } from "@/domains/list/typing";
import { Select } from "@/components/ui/select";
import { ButtonCore, InputCore, PopoverCore, SelectCore } from "@/domains/ui";
import { Button, Input, Popover } from "@/components/ui";
import { TableRowCore } from "@/domains/ui/table/row";
import { TableCellCore } from "@/domains/ui/table/cell";
import { TableCore, TableWithColumns } from "@/domains/ui/table/table";
import { TableColumn, TableColumnCore } from "@/domains/ui/table/column";
import { DEFAULT_RESPONSE } from "@/domains/list/constants";
import { TableFilterCore } from "@/biz/filter";
import { execQueryRaw, fetchTableList, fetchTableListProcess } from "@/biz/services";
import { buildQuerySQL } from "@/biz/filter/utils";

function SqliteDatabasePageCore(props: ViewComponentProps) {
  const { app, storage } = props;

  const response = {
    ...DEFAULT_RESPONSE,
    pageSize: 100,
  };
  const $request = {
    tableList: new RequestCore(fetchTableList, {
      process: fetchTableListProcess,
      onSuccess(v) {
        $filter.setTables(v);
      },
    }),
    exec: new RequestCore(execQueryRaw),
  };
  function buildColumns(columns: TableWithColumns["columns"], widths: Record<string, number>) {
    const prefix = new TableColumnCore({
      type: "index",
      name: "index",
      x: 0,
      width: widths["index"] || 200,
      is_primary_key: 0,
      // options: {},
    });
    const base = columns.map((column, i) => {
      const { name, type, references } = column;
      const r = new TableColumnCore({
        x: i,
        type,
        name: name,
        is_primary_key: 0,
        width: widths[name] || 200,
        references,
        // options: (() => {
        //   if (type === "datetime") {
        //     return {
        //       format: "YYYY-MM-DD",
        //     };
        //   }
        //   return {};
        // })(),
      });
      return r;
    });
    return [prefix, ...base].map((c, i) => {
      c.x = i;
      return c;
    });
  }
  function renderTable(dataSource: string[][], columns: TableColumn[], response: Response<any>) {
    console.log("render table", columns);
    return dataSource.map((row, index) => {
      const y = index + (response.page - 1) * response.pageSize;
      const cells = [
        new TableCellCore({
          x: 0,
          y,
          value: String(y + 1),
          width: columns[0].width,
          disabled: true,
          type: "index",
          $table,
        }),
      ].concat(
        row.map((cell, i) => {
          const column = columns[i + 1];
          return new TableCellCore({
            x: i + 1,
            y,
            value: cell as string,
            width: column.width,
            $table,
            onSelect(ins) {
              console.log("[PAGE]sqlite/index - in onSelect callback", curCell);
              if (curCell !== null) {
                curCell.unselect();
                curCell.unedit();
              }
              curCell = ins;
            },
            // onUpdate(opt) {
            //   const { x, y, value } = opt;
            //   const column = $table.columns[x];
            //   if (!column) {
            //     return;
            //   }
            //   const first = $table.columns[1];
            //   if (!first) {
            //     return;
            //   }
            //   const name = $table.name;
            //   if (!name) {
            //     return;
            //   }
            //   const id = row[0];
            //   const sql = `UPDATE ${name} SET ${column.name} = '${value}' WHERE ${first.name} = '${id}';`;
            //   console.log(sql);
            // },
          });
        })
      );
      const $row = new TableRowCore({ index: y, cells });
      // console.log($row);
      return $row;
    });
  }

  const $table = new TableCore({});
  const $filter = TableFilterCore({
    table: {
      name: $table.name,
      columns: $table.columns.map((col) => {
        return {
          name: col.name,
          type: col.type,
          width: col.width,
          // options: col.options,
        };
      }),
    },
    tables: $request.tableList.response || [],
    async onSearch(values) {
      response.page = 1;
      response.noMore = false;
      response.loading = true;
      emitter.emit(Events.ResponseChange, { ...response });
      const partSQL = buildQuerySQL($table, values, $request.tableList.response || []);
      console.log(values);
      // console.log(values.map((v) => v.value));
      console.log(partSQL);
      const pagination = ` LIMIT ${response.pageSize} OFFSET ${(response.page - 1) * response.pageSize}`;
      const sql = partSQL + pagination + ";";
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
  async function removeSelectedRows() {
    const { name, columns, data, selectedRows } = $table;
    const first = columns[1];
    if (!first) {
      return;
    }
    const sql = `DELETE FROM ${name} WHERE ${first.name} IN (${selectedRows
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
  }
  async function execPendingUpdate() {
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
        const sql = `UPDATE ${name} SET ${column.name} = '${value}' WHERE ${first.name} = '${id}';`;
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
  }

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
      $delete: new ButtonCore({
        onClick() {
          removeSelectedRows();
        },
      }),
      $update: new ButtonCore({
        onClick() {
          execPendingUpdate();
        },
      }),
      $drop: new ButtonCore({
        onClick() {
          const pending = $table.state.pendingUpdate;
          if (pending.length === 0) {
            return;
          }
          for (let i = 0; i < pending.length; i += 1) {
            const cell = pending[i];
            cell.cancelUpdate();
          }
        },
      }),
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
      $table.name = table.name;
      response.page = 1;
      response.loading = true;
      response.noMore = false;
      response.search.values = null;
      emitter.emit(Events.ResponseChange, { ...response });
      const widths = this.getWidths();
      const columns = buildColumns(table.columns, widths);
      $table.setColumns(columns);
      $filter.setTable(table);
      $filter.setOptions(columns);
      const r = await $request.exec.run({
        query: `SELECT * FROM ${table.name} LIMIT ${response.pageSize} OFFSET ${
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
      $table.setRows(rows);
      $table.setData(dataSource);
      $table.refresh();
    },
    getWidths() {
      const prev = storage.get("column_widths", {});
      const widths = prev[$table.name];
      return widths || {};
    },
    setWidth(column: TableColumnCore, width: number) {
      column.setWidth(width);
      const name = $table.name;
      storage.setWithPrev("column_widths", (v) => {
        return {
          ...v,
          [name]: {
            ...(v[name] || {}),
            [column.name]: width,
          },
        };
      });
      $table.setWidth();
      for (let i = 0; i < $table.rows.length; i += 1) {
        const row = $table.rows[i];
        // console.log(column.title, column.width);
        // const column = $page.ui.$table.columns[j];
        const cell = row.cells[column.x];
        cell.setWidth(column.width);
      }
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
      const { values } = $filter;
      const partSQL = buildQuerySQL($table, values, $request.tableList.response || []);
      console.log(values.map((v) => v.type));
      console.log(values.map((v) => v.value));
      console.log(partSQL);
      const pagination = ` LIMIT ${response.pageSize} OFFSET ${(response.page - 1) * response.pageSize}`;
      const sql = partSQL + pagination + ";";
      const r = await $request.exec.run({
        query: sql,
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
  if (type === "integer") {
    // return <CaseLower class="w-4 h-4" />;
    return <div>num</div>;
  }
  if (type === "text") {
    return <Hash class="w-4 h-4" />;
  }
  if (type === "datetime") {
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
      {state().name}
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
  const [filter, setFilter] = createSignal($page.ui.$filter.values);
  const [left, setLeft] = createSignal(0);

  let $head: HTMLDivElement;

  $request.tableList.onResponseChange((v) => {
    if (v === null) {
      return;
    }
    console.log("[PAGE]home/index - the table list is", v);
    const prev = storage.get("column_widths", {});
    const widths = prev[$page.ui.$table.name];
    if (widths) {
      for (let i = 0; i < v.length; i += 1) {
        const t = v[i];
        for (let j = 0; j < t.columns.length; j += 1) {
          const column = t.columns[j];
          const w = widths[column.name] || 200;
          column.width = w;
        }
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
                    if (filter.$input instanceof SelectCore) {
                      return <Select store={filter.$input} />;
                    }
                    if (filter.$input instanceof InputCore) {
                      return <Input store={filter.$input} />;
                    }
                    return null;
                  }}
                </For>
                <Show when={filter().length}>
                  <Button store={$page.ui.$filter.$submit}>查询</Button>
                </Show>
              </div>
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

          <div class="absolute left-1/2 bottom-12 bg-white rounded-md -translate-x-1/2 animate animate-in slide-from-bottom">
            <div class="space-x-2">
              <Show when={table().selectedRows.length}>
                <Button store={$page.ui.$delete}>删除{table().selectedRows.length}条记录</Button>
              </Show>
              <Show when={table().pendingUpdate.length}>
                <Button store={$page.ui.$update}>保存{table().pendingUpdate.length}个修改</Button>
                <Button store={$page.ui.$drop}>放弃修改</Button>
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
                      <div>{column.name}</div>
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
                          $page.setWidth(column, num);
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
