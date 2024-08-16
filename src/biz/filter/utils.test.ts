import { describe, it, expect } from "vitest";

import { InputCore, SelectCore } from "@/domains/ui";

import { FilterInput } from "./index";
import { buildQuerySQL } from "./utils";
import { TableCore } from "@/domains/ui/table/table";

describe("query SQL build", () => {
  it("there is no filter", () => {
    const inputs: FilterInput[] = [];
    const sql = buildQuerySQL(
      new TableCore({
        name: "paragraphs",
      }),
      inputs,
      []
    );
    expect(sql).toBe("SELECT `paragraphs`.* FROM `paragraphs`");
  });
  it("only one field", () => {
    const inputs = [
      new FilterInput({
        type: "field",
        column: {
          name: "name",
          type: "text",
          width: 0,
        },
        $input: new SelectCore({
          defaultValue: "name",
        }),
      }),
      new FilterInput({
        type: "condition",
        $input: new SelectCore({
          defaultValue: "LIKE",
        }),
      }),
      new FilterInput({
        type: "value",
        $input: new InputCore({
          defaultValue: "hello",
        }),
      }),
    ];
    const sql = buildQuerySQL(
      new TableCore({
        name: "paragraphs",
      }),
      inputs,
      []
    );
    expect(sql).toBe("SELECT `paragraphs`.* FROM `paragraphs` WHERE `name` LIKE '%hello%'");
  });
  it("has join", () => {
    const inputs = [
      new FilterInput({
        type: "join",
        column: {
          name: "subtitle_id",
          type: "integer",
          width: 0,
          references: "subtitles",
          is_primary_key: 0,
        },
        $input: new SelectCore({
          defaultValue: "subtitles",
        }),
      }),
      new FilterInput({
        type: "field",
        column: {
          name: "title",
          type: "text",
          width: 0,
        },
        $input: new SelectCore({
          defaultValue: "title",
        }),
      }),
      new FilterInput({
        type: "condition",
        $input: new SelectCore({
          defaultValue: "LIKE",
        }),
      }),
      new FilterInput({
        type: "value",
        $input: new InputCore({
          defaultValue: "Friends",
        }),
      }),
    ];
    const sql = buildQuerySQL(new TableCore({ name: "paragraphs" }), inputs, [
      {
        name: "subtitles",
        columns: [
          {
            name: "id",
            type: "integer",
            is_primary_key: 1,
            width: 0,
          },
        ],
      },
    ]);
    expect(sql).toBe(
      "SELECT `paragraphs`.* FROM `paragraphs` JOIN `subtitles` ON `subtitles`.`id` = `paragraphs`.`subtitle_id` WHERE `subtitles`.`title` LIKE '%Friends%'"
    );
  });
});
