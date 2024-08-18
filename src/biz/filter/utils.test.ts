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

  it("test1", () => {
    const inputs = [
      [
        new FilterInput({
          type: "field",
          column: {
            name: "grade_id",
            type: TableColumnType.Integer,
            width: 0,
            references: "grades",
            is_primary_key: 0,
          },
          $input: new SelectCore({
            defaultValue: "grades",
          }),
        }),
        new FilterInput({
          type: "field",
          column: {
            name: "grade",
            type: TableColumnType.Integer,
            width: 0,
          },
          $input: new SelectCore({
            defaultValue: "grade",
          }),
        }),
        new FilterInput({
          type: "condition",
          $input: new SelectCore({
            defaultValue: "=",
          }),
        }),
        new FilterInput({
          type: "value",
          $input: new InputCore({
            defaultValue: 5,
          }),
        }),
      ],
    ];
    const result = buildORMObject(new TableCore({ name: "students" }), inputs, [
      {
        name: "grades",
        columns: [
          {
            name: "id",
            type: TableColumnType.Integer,
            is_primary_key: 1,
            width: 0,
          },
          {
            name: "grade",
            type: TableColumnType.Integer,
            is_primary_key: 0,
            width: 0,
          },
        ],
      },
    ]);
    expect(result).toStrictEqual({
      name: "students",
      where: {
        grades: {
          grade: {
            equals: 5,
          },
        },
      },
    });
  });
});

describe.skip("query SQL build", () => {
  it("there is no filter", () => {
    const inputs: FilterInput[][] = [];
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
      [
        new FilterInput({
          type: "field",
          column: {
            name: "name",
            type: TableColumnType.Text,
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
      ],
    ];
    const sql = buildQuerySQL(
      {
        name: "paragraphs",
        columns: [
          {
            name: "name",
            type: TableColumnType.Text,
            width: 0,
          },
        ],
      },
      inputs,
      []
    );
    expect(sql).toBe("SELECT `paragraphs`.* FROM `paragraphs` WHERE `paragraphs`.`name` LIKE '%hello%'");
  });

  it("has join", () => {
    const inputs = [
      [
        new FilterInput({
          type: "field",
          column: {
            name: "grade_id",
            type: TableColumnType.Integer,
            width: 0,
            references: "grades",
            is_primary_key: 0,
          },
          $input: new SelectCore({
            defaultValue: "grades",
          }),
        }),
        new FilterInput({
          type: "field",
          column: {
            name: "grade",
            type: TableColumnType.Integer,
            width: 0,
          },
          $input: new SelectCore({
            defaultValue: "grade",
          }),
        }),
        new FilterInput({
          type: "condition",
          $input: new SelectCore({
            defaultValue: "=",
          }),
        }),
        new FilterInput({
          type: "value",
          $input: new InputCore({
            defaultValue: 5,
          }),
        }),
      ],
    ];
    const sql = buildQuerySQL(
      {
        name: "students",
        columns: [
          {
            type: TableColumnType.Integer,
            name: "id",
            width: 0,
          },
          {
            type: TableColumnType.Integer,
            name: "grade_id",
            width: 0,
            references: "grades",
          },
        ],
      },
      inputs,
      [
        {
          name: "grades",
          columns: [
            {
              name: "id",
              type: TableColumnType.Integer,
              is_primary_key: 1,
              width: 0,
            },
            {
              name: "grade",
              type: TableColumnType.Integer,
              is_primary_key: 0,
              width: 0,
            },
          ],
        },
      ]
    );
    expect(sql).toBe(
      "SELECT `students`.* FROM `students` JOIN `grades` ON `grades`.`id` = `students`.`grade_id` WHERE `grades`.`grade` = 5"
    );
  });
  it("has tow join", () => {
    const inputs = [
      [
        new FilterInput({
          type: "field",
          column: {
            name: "grade_id",
            type: TableColumnType.Integer,
            width: 0,
            references: "grades",
          },
          $input: new SelectCore({
            defaultValue: "grades",
          }),
        }),
        new FilterInput({
          type: "field",
          column: {
            name: "school_id",
            type: TableColumnType.Integer,
            width: 0,
            references: "schools",
            is_primary_key: 0,
          },
          $input: new SelectCore({
            defaultValue: "schools",
          }),
        }),
        new FilterInput({
          type: "field",
          column: {
            name: "name",
            type: TableColumnType.Text,
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
            defaultValue: "Friends",
          }),
        }),
      ],
    ];
    const sql = buildQuerySQL(
      {
        name: "students",
        columns: [
          {
            name: "id",
            type: TableColumnType.Integer,
            is_primary_key: 1,
            width: 0,
          },
          {
            name: "grade_id",
            type: TableColumnType.Integer,
            references: "grades",
            width: 0,
          },
        ],
      },
      inputs,
      [
        {
          name: "grades",
          columns: [
            {
              name: "id",
              type: TableColumnType.Integer,
              is_primary_key: 1,
              width: 0,
            },
            {
              name: "school_id",
              type: TableColumnType.Integer,
              references: "schools",
              width: 0,
            },
          ],
        },
        {
          name: "schools",
          columns: [
            {
              name: "id",
              type: TableColumnType.Integer,
              is_primary_key: 1,
              width: 0,
            },
            {
              name: "name",
              type: TableColumnType.Text,
              width: 0,
            },
          ],
        },
      ]
    );
    expect(sql).toBe(
      "SELECT `students`.* FROM `students` JOIN `grades` ON `grades`.`id` = `students`.`grade_id` JOIN `schools` ON `schools`.`id` = `grades`.`school_id` WHERE `schools`.`name` LIKE '%Friends%'"
    );
  });

  it("join with AND operator", () => {
    const inputs = [
      [
        new FilterInput({
          type: "field",
          column: {
            name: "grade_id",
            type: TableColumnType.Integer,
            width: 0,
            references: "grades",
          },
          $input: new SelectCore({
            defaultValue: "grades",
          }),
        }),
        new FilterInput({
          type: "field",
          column: {
            name: "school_id",
            type: TableColumnType.Integer,
            width: 0,
            references: "schools",
            is_primary_key: 0,
          },
          $input: new SelectCore({
            defaultValue: "schools",
          }),
        }),
        new FilterInput({
          type: "field",
          column: {
            name: "name",
            type: TableColumnType.Text,
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
            defaultValue: "Friends",
          }),
        }),
      ],
      [
        new FilterInput({
          type: "multiple",
          $input: new SelectCore({ defaultValue: "AND", options: [] }),
        }),
        new FilterInput({
          type: "field",
          column: {
            name: "grade_id",
            type: TableColumnType.Integer,
            width: 0,
            references: "grades",
          },
          $input: new SelectCore({
            defaultValue: "grades",
          }),
        }),
        new FilterInput({
          type: "field",
          column: {
            name: "school_id",
            type: TableColumnType.Integer,
            width: 0,
            references: "schools",
            is_primary_key: 0,
          },
          $input: new SelectCore({
            defaultValue: "schools",
          }),
        }),
        new FilterInput({
          type: "field",
          column: {
            name: "address",
            type: TableColumnType.Text,
            width: 0,
          },
          $input: new SelectCore({
            defaultValue: "address",
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
            defaultValue: "Hangzhou",
          }),
        }),
      ],
    ];
    const sql = buildQuerySQL(
      {
        name: "students",
        columns: [
          {
            name: "id",
            type: TableColumnType.Integer,
            is_primary_key: 1,
            width: 0,
          },
          {
            name: "grade_id",
            type: TableColumnType.Integer,
            references: "grades",
            width: 0,
          },
        ],
      },
      inputs,
      [
        {
          name: "grades",
          columns: [
            {
              name: "id",
              type: TableColumnType.Integer,
              is_primary_key: 1,
              width: 0,
            },
            {
              name: "school_id",
              type: TableColumnType.Integer,
              references: "schools",
              width: 0,
            },
          ],
        },
        {
          name: "schools",
          columns: [
            {
              name: "id",
              type: TableColumnType.Integer,
              is_primary_key: 1,
              width: 0,
            },
            {
              name: "name",
              type: TableColumnType.Text,
              width: 0,
            },
            {
              name: "address",
              type: TableColumnType.Text,
              width: 0,
            },
          ],
        },
      ]
    );
    expect(sql).toBe(
      "SELECT `students`.* FROM `students` JOIN `grades` ON `grades`.`id` = `students`.`grade_id` JOIN `schools` ON `schools`.`id` = `grades`.`school_id` WHERE (`schools`.`name` LIKE '%Friends%' AND `schools`.`address` LIKE '%Hangzhou%')"
    );
  });

  it("join with mix AND and OR operator", () => {
    const inputs = [
      [
        new FilterInput({
          type: "field",
          column: {
            name: "name",
            type: TableColumnType.Text,
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
            defaultValue: "hong",
          }),
        }),
      ],
      [
        new FilterInput({
          type: "multiple",
          $input: new SelectCore({ defaultValue: "OR", options: [] }),
        }),
        new FilterInput({
          type: "field",
          column: {
            name: "name",
            type: TableColumnType.Text,
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
            defaultValue: "ming",
          }),
        }),
      ],
      [
        new FilterInput({
          type: "multiple",
          $input: new SelectCore({ defaultValue: "AND", options: [] }),
        }),
        new FilterInput({
          type: "field",
          column: {
            name: "grade_id",
            type: TableColumnType.Integer,
            width: 0,
            references: "grades",
          },
          $input: new SelectCore({
            defaultValue: "grades",
          }),
        }),
        new FilterInput({
          type: "field",
          column: {
            name: "school_id",
            type: TableColumnType.Integer,
            width: 0,
            references: "schools",
            is_primary_key: 0,
          },
          $input: new SelectCore({
            defaultValue: "schools",
          }),
        }),
        new FilterInput({
          type: "field",
          column: {
            name: "name",
            type: TableColumnType.Text,
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
            defaultValue: "Friends",
          }),
        }),
      ],
    ];
    const sql = buildQuerySQL(
      {
        name: "students",
        columns: [
          {
            name: "id",
            type: TableColumnType.Integer,
            is_primary_key: 1,
            width: 0,
          },
          {
            name: "name",
            type: TableColumnType.Text,
            width: 0,
          },
          {
            name: "grade_id",
            type: TableColumnType.Integer,
            references: "grades",
            width: 0,
          },
        ],
      },
      inputs,
      [
        {
          name: "grades",
          columns: [
            {
              name: "id",
              type: TableColumnType.Integer,
              is_primary_key: 1,
              width: 0,
            },
            {
              name: "grade",
              type: TableColumnType.Integer,
              width: 0,
            },
            {
              name: "school_id",
              type: TableColumnType.Integer,
              references: "schools",
              width: 0,
            },
          ],
        },
        {
          name: "schools",
          columns: [
            {
              name: "id",
              type: TableColumnType.Integer,
              is_primary_key: 1,
              width: 0,
            },
            {
              name: "name",
              type: TableColumnType.Text,
              width: 0,
            },
            {
              name: "address",
              type: TableColumnType.Text,
              width: 0,
            },
          ],
        },
      ]
    );
    expect(sql).toBe(
      "SELECT `students`.* FROM `students` JOIN `grades` ON `grades`.`id` = `students`.`grade_id` JOIN `schools` ON `schools`.`id` = `grades`.`school_id` WHERE ((`students`.`name` LIKE '%hong%' OR `students`.`name` LIKE '%ming%') AND `schools`.`name` LIKE '%Friends%')"
    );
  });
});
