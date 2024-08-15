import { BaseDomain, Handler } from "@/domains/base";

// import { TableColumn } from "./table";
export type TableColumn = {
  title: string;
  type: "index" | "text" | "calendar" | "numeric";
  width: number;
  options: {
    format?: string;
  };
};

enum Events {
  Change,
}
type TheTypesOfBaseEvents = {
  [Events.Change]: TableColumnCoreState;
};
type TableColumnCoreProps = {
  title: string;
  type: "index" | "text" | "calendar" | "numeric";
  width?: number;
  x: number;
  options?: {
    format?: string;
  };
};
type TableColumnCoreState = {
  width: number;
  title: string;
  type: TableColumn["type"];
};

export class TableColumnCore extends BaseDomain<TheTypesOfBaseEvents> {
  title: string;
  type: TableColumn["type"] = "text";
  width = 0;
  x = 0;
  options: TableColumn["options"] = {};

  get state(): TableColumnCoreState {
    return {
      title: this.title,
      type: this.type,
      width: this.width,
    };
  }

  constructor(props: TableColumnCoreProps) {
    super(props);

    const { title, type, x, width = 200, options = {} } = props;

    this.title = title;
    this.width = width;
    this.type = type;
    this.x = x;
    this.options = options;
  }
  setWidth(width: number) {
    this.width = width;
    this.emit(Events.Change, { ...this.state });
  }

  onChange(handler: Handler<TheTypesOfBaseEvents[Events.Change]>) {
    return this.on(Events.Change, handler);
  }
}
