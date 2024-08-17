import { describe, it, expect } from "vitest";

import { InputCore, SelectCore, TabsCore } from "@/domains/ui";

import { FilterInput, PrefixTag } from "./index";
import { buildORMObject, buildQuerySQL } from "./utils";
import { TableCore } from "@/domains/ui/table/table";
import { TableColumnType } from "@/domains/ui/table/column";

describe("build orm object", () => {
  it("no join and only text field LIKE", () => {
    const rows = [
      [
        new FilterInput({
          type: "multiple",
          $input: new PrefixTag({ value: "WHERE" }),
        }),
        new FilterInput({
          type: "field",
          column: {
            type: TableColumnType.Text,
            name: "name",
            width: 0,
          },
          $input: new InputCore({ defaultValue: "name" }),
        }),
        new FilterInput({
          type: "condition",
          $input: new InputCore({ defaultValue: "LIKE" }),
        }),
        new FilterInput({
          type: "value",
          $input: new InputCore({ defaultValue: "Friends" }),
        }),
      ],
    ];
    const result = buildORMObject(new TableCore({ name: "subtitles" }), rows, []);
    expect(result).toStrictEqual({
      name: "subtitles",
      where: {
        name: {
          contains: "Friends",
        },
      },
    });
  });

  it("no join and only text field equal", () => {
    const rows = [
      [
        new FilterInput({
          type: "multiple",
          $input: new PrefixTag({ value: "WHERE" }),
        }),
        new FilterInput({
          type: "field",
          column: {
            type: TableColumnType.Text,
            name: "name",
            width: 0,
          },
          $input: new InputCore({ defaultValue: "name" }),
        }),
        new FilterInput({
          type: "condition",
          $input: new InputCore({ defaultValue: "=" }),
        }),
        new FilterInput({
          type: "value",
          $input: new InputCore({ defaultValue: "Friends" }),
        }),
      ],
    ];
    const result = buildORMObject(new TableCore({ name: "subtitles" }), rows, []);
    expect(result).toStrictEqual({
      name: "subtitles",
      where: {
        name: {
          equals: "Friends",
        },
      },
    });
  });

  it("no join and multiple field", () => {
    const rows = [
      [
        new FilterInput({
          type: "multiple",
          $input: new PrefixTag({ value: "WHERE" }),
        }),
        new FilterInput({
          type: "field",
          column: {
            type: TableColumnType.Integer,
            name: "grade_id",
            width: 0,
            references: "grades",
          },
          $input: new InputCore({ defaultValue: "grades" }),
        }),
        new FilterInput({
          type: "field",
          column: {
            type: TableColumnType.Integer,
            name: "school_id",
            width: 0,
            references: "schools",
          },
          $input: new InputCore({ defaultValue: "schools" }),
        }),
        new FilterInput({
          type: "field",
          column: {
            type: TableColumnType.Text,
            name: "address",
            width: 0,
          },
          $input: new InputCore({ defaultValue: "address" }),
        }),
        new FilterInput({
          type: "condition",
          $input: new InputCore({ defaultValue: "LIKE" }),
        }),
        new FilterInput({
          type: "value",
          $input: new InputCore({ defaultValue: "xihongshi" }),
        }),
      ],
    ];
    const result = buildORMObject(new TableCore({ name: "students" }), rows, []);
    expect(result).toStrictEqual({
      name: "students",
      where: {
        grades: {
          schools: {
            address: {
              contains: "xihongshi",
            },
          },
        },
      },
    });
  });

  it("no join and two row with AND", () => {
    const rows = [
      [
        new FilterInput({
          type: "multiple",
          $input: new PrefixTag({ value: "WHERE" }),
        }),
        new FilterInput({
          type: "field",
          column: {
            type: TableColumnType.Text,
            name: "name",
            width: 0,
          },
          $input: new InputCore({ defaultValue: "name" }),
        }),
        new FilterInput({
          type: "condition",
          $input: new InputCore({ defaultValue: "LIKE" }),
        }),
        new FilterInput({
          type: "value",
          $input: new InputCore({ defaultValue: "hong" }),
        }),
      ],
      [
        new FilterInput({
          type: "multiple",
          $input: new PrefixTag({ value: "AND" }),
        }),
        new FilterInput({
          type: "field",
          column: {
            type: TableColumnType.Integer,
            name: "age",
            width: 0,
          },
          $input: new InputCore({ defaultValue: "age" }),
        }),
        new FilterInput({
          type: "condition",
          $input: new InputCore({ defaultValue: "<" }),
        }),
        new FilterInput({
          type: "value",
          $input: new InputCore({ defaultValue: 10 }),
        }),
      ],
    ];
    const result = buildORMObject(new TableCore({ name: "students" }), rows, []);
    expect(result).toStrictEqual({
      name: "students",
      where: {
        AND: [
          {
            name: {
              contains: "hong",
            },
          },
          {
            age: {
              lt: 10,
            },
          },
        ],
      },
    });
  });

  it("no join and two row with OR", () => {
    const rows = [
      [
        new FilterInput({
          type: "multiple",
          $input: new PrefixTag({ value: "WHERE" }),
        }),
        new FilterInput({
          type: "field",
          column: {
            type: TableColumnType.Text,
            name: "name",
            width: 0,
          },
          $input: new InputCore({ defaultValue: "name" }),
        }),
        new FilterInput({
          type: "condition",
          $input: new InputCore({ defaultValue: "LIKE" }),
        }),
        new FilterInput({
          type: "value",
          $input: new InputCore({ defaultValue: "hong" }),
        }),
      ],
      [
        new FilterInput({
          type: "multiple",
          $input: new PrefixTag({ value: "OR" }),
        }),
        new FilterInput({
          type: "field",
          column: {
            type: TableColumnType.Integer,
            name: "age",
            width: 0,
          },
          $input: new InputCore({ defaultValue: "age" }),
        }),
        new FilterInput({
          type: "condition",
          $input: new InputCore({ defaultValue: "<" }),
        }),
        new FilterInput({
          type: "value",
          $input: new InputCore({ defaultValue: 10 }),
        }),
      ],
    ];
    const result = buildORMObject(new TableCore({ name: "students" }), rows, []);
    expect(result).toStrictEqual({
      name: "students",
      where: {
        OR: [
          {
            name: {
              contains: "hong",
            },
          },
          {
            age: {
              lt: 10,
            },
          },
        ],
      },
    });
  });

  it("no join and mix AND with OR", () => {
    const rows = [
      [
        new FilterInput({
          type: "multiple",
          $input: new PrefixTag({ value: "WHERE" }),
        }),
        new FilterInput({
          type: "field",
          column: {
            type: TableColumnType.Text,
            name: "name",
            width: 0,
          },
          $input: new InputCore({ defaultValue: "name" }),
        }),
        new FilterInput({
          type: "condition",
          $input: new InputCore({ defaultValue: "LIKE" }),
        }),
        new FilterInput({
          type: "value",
          $input: new InputCore({ defaultValue: "hong" }),
        }),
      ],
      [
        new FilterInput({
          type: "multiple",
          $input: new PrefixTag({ value: "OR" }),
        }),
        new FilterInput({
          type: "field",
          column: {
            type: TableColumnType.Text,
            name: "name",
            width: 0,
          },
          $input: new InputCore({ defaultValue: "name" }),
        }),
        new FilterInput({
          type: "condition",
          $input: new InputCore({ defaultValue: "LIKE" }),
        }),
        new FilterInput({
          type: "value",
          $input: new InputCore({ defaultValue: "ming" }),
        }),
      ],
      [
        new FilterInput({
          type: "multiple",
          $input: new PrefixTag({ value: "AND" }),
        }),
        new FilterInput({
          type: "field",
          column: {
            type: TableColumnType.Integer,
            name: "age",
            width: 0,
          },
          $input: new InputCore({ defaultValue: "age" }),
        }),
        new FilterInput({
          type: "condition",
          $input: new InputCore({ defaultValue: ">" }),
        }),
        new FilterInput({
          type: "value",
          $input: new InputCore({ defaultValue: 10 }),
        }),
      ],
    ];
    const result = buildORMObject(new TableCore({ name: "students" }), rows, []);
    expect(result).toStrictEqual({
      name: "students",
      where: {
        AND: [
          {
            OR: [
              {
                name: {
                  contains: "hong",
                },
              },
              {
                name: {
                  contains: "ming",
                },
              },
            ],
          },
          {
            age: {
              gt: 10,
            },
          },
        ],
      },
    });
  });

  it("no join and multiple field", () => {
    const rows = [
      [
        new FilterInput({
          type: "multiple",
          $input: new PrefixTag({ value: "WHERE" }),
        }),
        new FilterInput({
          type: "field",
          column: {
            type: TableColumnType.Integer,
            name: "grade_id",
            width: 0,
            references: "grades",
          },
          $input: new InputCore({ defaultValue: "grades" }),
        }),
        new FilterInput({
          type: "field",
          column: {
            type: TableColumnType.Integer,
            name: "school_id",
            width: 0,
            references: "schools",
          },
          $input: new InputCore({ defaultValue: "schools" }),
        }),
        new FilterInput({
          type: "field",
          column: {
            type: TableColumnType.Text,
            name: "address",
            width: 0,
          },
          $input: new InputCore({ defaultValue: "address" }),
        }),
        new FilterInput({
          type: "condition",
          $input: new InputCore({ defaultValue: "LIKE" }),
        }),
        new FilterInput({
          type: "value",
          $input: new InputCore({ defaultValue: "xihongshi" }),
        }),
      ],
      [
        new FilterInput({
          type: "multiple",
          $input: new PrefixTag({ value: "AND" }),
        }),
        new FilterInput({
          type: "field",
          column: {
            type: TableColumnType.Text,
            name: "name",
            width: 0,
          },
          $input: new InputCore({ defaultValue: "name" }),
        }),
        new FilterInput({
          type: "condition",
          $input: new InputCore({ defaultValue: "LIKE" }),
        }),
        new FilterInput({
          type: "value",
          $input: new InputCore({ defaultValue: "ming" }),
        }),
      ],
      [
        new FilterInput({
          type: "multiple",
          $input: new PrefixTag({ value: "OR" }),
        }),
        new FilterInput({
          type: "field",
          column: {
            type: TableColumnType.Text,
            name: "name",
            width: 0,
          },
          $input: new InputCore({ defaultValue: "name" }),
        }),
        new FilterInput({
          type: "condition",
          $input: new InputCore({ defaultValue: "LIKE" }),
        }),
        new FilterInput({
          type: "value",
          $input: new InputCore({ defaultValue: "hong" }),
        }),
      ],
      [
        new FilterInput({
          type: "multiple",
          $input: new PrefixTag({ value: "AND" }),
        }),
        new FilterInput({
          type: "field",
          column: {
            type: TableColumnType.Integer,
            name: "age",
            width: 0,
          },
          $input: new InputCore({ defaultValue: "age" }),
        }),
        new FilterInput({
          type: "condition",
          $input: new InputCore({ defaultValue: "<" }),
        }),
        new FilterInput({
          type: "value",
          $input: new InputCore({ defaultValue: 10 }),
        }),
      ],
    ];
    const result = buildORMObject(new TableCore({ name: "students" }), rows, []);
    expect(result).toStrictEqual({
      name: "students",
      where: {
        AND: [
          {
            OR: [
              {
                AND: [
                  {
                    grades: {
                      schools: {
                        address: {
                          contains: "xihongshi",
                        },
                      },
                    },
                  },
                  {
                    name: {
                      contains: "ming",
                    },
                  },
                ],
              },
              {
                name: {
                  contains: "hong",
                },
              },
            ],
          },
          {
            age: {
              lt: 10,
            },
          },
        ],
      },
    });
  });
});

// describe("query SQL build", () => {
//   it.skip("there is no filter", () => {
//     const inputs: FilterInput[] = [];
//     const sql = buildQuerySQL(
//       new TableCore({
//         name: "paragraphs",
//       }),
//       inputs,
//       []
//     );
//     expect(sql).toBe("SELECT `paragraphs`.* FROM `paragraphs`");
//   });
//   it.skip("only one field", () => {
//     const inputs = [
//       new FilterInput({
//         type: "field",
//         column: {
//           name: "name",
//           type: "text",
//           width: 0,
//         },
//         $input: new SelectCore({
//           defaultValue: "name",
//         }),
//       }),
//       new FilterInput({
//         type: "condition",
//         $input: new SelectCore({
//           defaultValue: "LIKE",
//         }),
//       }),
//       new FilterInput({
//         type: "value",
//         $input: new InputCore({
//           defaultValue: "hello",
//         }),
//       }),
//     ];
//     const sql = buildQuerySQL(
//       new TableCore({
//         name: "paragraphs",
//       }),
//       inputs,
//       []
//     );
//     expect(sql).toBe("SELECT `paragraphs`.* FROM `paragraphs` WHERE `name` LIKE '%hello%'");
//   });
//   it.skip("has join", () => {
//     const inputs = [
//       new FilterInput({
//         type: "join",
//         column: {
//           name: "subtitle_id",
//           type: "integer",
//           width: 0,
//           references: "subtitles",
//           is_primary_key: 0,
//         },
//         $input: new SelectCore({
//           defaultValue: "subtitles",
//         }),
//       }),
//       new FilterInput({
//         type: "field",
//         column: {
//           name: "title",
//           type: "text",
//           width: 0,
//         },
//         $input: new SelectCore({
//           defaultValue: "title",
//         }),
//       }),
//       new FilterInput({
//         type: "condition",
//         $input: new SelectCore({
//           defaultValue: "LIKE",
//         }),
//       }),
//       new FilterInput({
//         type: "value",
//         $input: new InputCore({
//           defaultValue: "Friends",
//         }),
//       }),
//     ];
//     const sql = buildQuerySQL(new TableCore({ name: "paragraphs" }), inputs, [
//       {
//         name: "subtitles",
//         columns: [
//           {
//             name: "id",
//             type: "integer",
//             is_primary_key: 1,
//             width: 0,
//           },
//         ],
//       },
//     ]);
//     expect(sql).toBe(
//       "SELECT `paragraphs`.* FROM `paragraphs` JOIN `subtitles` ON `subtitles`.`id` = `paragraphs`.`subtitle_id` WHERE `subtitles`.`title` LIKE '%Friends%'"
//     );
//   });
//   it("has tow join", () => {
//     const inputs = [
//       new FilterInput({
//         type: "join",
//         column: {
//           name: "media_episode_profile_id",
//           type: "integer",
//           width: 0,
//           references: "media_episode_profiles",
//           is_primary_key: 0,
//         },
//         $input: new SelectCore({
//           defaultValue: "media_episode_profiles",
//         }),
//       }),
//       new FilterInput({
//         type: "join",
//         column: {
//           name: "media_profile_id",
//           type: "integer",
//           width: 0,
//           references: "media_profiles",
//           is_primary_key: 0,
//         },
//         $input: new SelectCore({
//           defaultValue: "media_profiles",
//         }),
//       }),
//       new FilterInput({
//         type: "field",
//         column: {
//           name: "title",
//           type: "text",
//           width: 0,
//         },
//         $input: new SelectCore({
//           defaultValue: "title",
//         }),
//       }),
//       new FilterInput({
//         type: "condition",
//         $input: new SelectCore({
//           defaultValue: "LIKE",
//         }),
//       }),
//       new FilterInput({
//         type: "value",
//         $input: new InputCore({
//           defaultValue: "Friends",
//         }),
//       }),
//     ];
//     const sql = buildQuerySQL(new TableCore({ name: "subtitles" }), inputs, [
//       {
//         name: "media_episode_profiles",
//         columns: [
//           {
//             name: "unique_id",
//             type: "integer",
//             is_primary_key: 1,
//             width: 0,
//           },
//           {
//             name: "media_profile_id",
//             type: "integer",
//             is_primary_key: 0,
//             references: "media_profiles",
//             width: 0,
//           },
//         ],
//       },
//       {
//         name: "media_profiles",
//         columns: [
//           {
//             name: "unique_id",
//             type: "integer",
//             is_primary_key: 1,
//             width: 0,
//           },
//         ],
//       },
//     ]);
//     expect(sql).toBe(
//       "SELECT `subtitles`.* FROM `subtitles` JOIN `media_episode_profiles` ON `media_episode_profiles`.`unique_id` = `subtitles`.`media_episode_profile_id` JOIN `media_profiles` ON `media_profiles`.`unique_id` = `media_episode_profiles`.`media_profile_id` WHERE `media_profiles`.`title` LIKE '%Friends%'"
//     );
//   });
// });
