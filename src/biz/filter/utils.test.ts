import { describe, it, expect } from "vitest";

import { InputCore, SelectCore } from "@/domains/ui";

import { FilterInput } from "./index";
import { buildQuerySQL } from "./utils";
import { TableCore } from "@/domains/ui/table/table";

describe("query SQL build", () => {
  it.skip("there is no filter", () => {
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
  it.skip("only one field", () => {
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
  it.skip("has join", () => {
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
  it("has tow join", () => {
    const inputs = [
      new FilterInput({
        type: "join",
        column: {
          name: "media_episode_profile_id",
          type: "integer",
          width: 0,
          references: "media_episode_profiles",
          is_primary_key: 0,
        },
        $input: new SelectCore({
          defaultValue: "media_episode_profiles",
        }),
      }),
      new FilterInput({
        type: "join",
        column: {
          name: "media_profile_id",
          type: "integer",
          width: 0,
          references: "media_profiles",
          is_primary_key: 0,
        },
        $input: new SelectCore({
          defaultValue: "media_profiles",
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
    const sql = buildQuerySQL(new TableCore({ name: "subtitles" }), inputs, [
      {
        name: "media_episode_profiles",
        columns: [
          {
            name: "unique_id",
            type: "integer",
            is_primary_key: 1,
            width: 0,
          },
          {
            name: "media_profile_id",
            type: "integer",
            is_primary_key: 0,
            references: "media_profiles",
            width: 0,
          },
        ],
      },
      {
        name: "media_profiles",
        columns: [
          {
            name: "unique_id",
            type: "integer",
            is_primary_key: 1,
            width: 0,
          },
        ],
      },
    ]);
    expect(sql).toBe(
      "SELECT `subtitles`.* FROM `subtitles` JOIN `media_episode_profiles` ON `media_episode_profiles`.`unique_id` = `subtitles`.`media_episode_profile_id` JOIN `media_profiles` ON `media_profiles`.`unique_id` = `media_episode_profiles`.`media_profile_id` WHERE `media_profiles`.`title` LIKE '%Friends%'"
    );
  });
});
