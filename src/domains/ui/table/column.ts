import { BaseDomain, Handler } from "@/domains/base";

export type TableColumn = {
  name: string;
  type: "index" | "datetime" | "text" | "integer" | "table";
  width: number;
  references?: string;
  is_primary_key?: number;
  // options: {
  //   format?: string;
  // };
};

enum Events {
  Change,
}
type TheTypesOfBaseEvents = {
  [Events.Change]: TableColumnCoreState;
};
type TableColumnCoreProps = {
  name: string;
  type: TableColumn["type"];
  width?: number;
  references?: string;
  is_primary_key: number;
  x: number;
  // options?: {
  //   format?: string;
  // };
};
type TableColumnCoreState = {
  width: number;
  name: string;
  type: TableColumn["type"];
};

export class TableColumnCore extends BaseDomain<TheTypesOfBaseEvents> {
  name: string;
  type: TableColumn["type"] = "text";
  references?: string;
  width = 0;
  x = 0;
  // options: TableColumn["options"] = {};

  get state(): TableColumnCoreState {
    return {
      name: this.name,
      type: this.type,
      width: this.width,
    };
  }

  constructor(props: TableColumnCoreProps) {
    super(props);

    const { name, type, references, x, width = 200 } = props;

    this.name = name;
    this.type = type;
    this.references = references;
    this.x = x;
    this.width = width;
    // this.options = options;
  }
  setWidth(width: number) {
    this.width = width;
    this.emit(Events.Change, { ...this.state });
  }

  onChange(handler: Handler<TheTypesOfBaseEvents[Events.Change]>) {
    return this.on(Events.Change, handler);
  }
}
