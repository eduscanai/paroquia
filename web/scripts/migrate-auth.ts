import { config } from "dotenv";

config({ path: ".env.local" });

type FieldType = "string" | "boolean" | "date" | "number" | "string[]" | "number[]";

type FieldAttribute = {
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  defaultValue?: unknown;
  references?: { model: string; field: string; onDelete?: string };
};

type TableSchema = {
  fields: Record<string, FieldAttribute>;
  order: number;
  indexes?: { columns: string[]; name: string; unique?: boolean }[];
};

function pgType(type: FieldType): string {
  switch (type) {
    case "string":
      return "text";
    case "boolean":
      return "boolean";
    case "date":
      return "timestamptz";
    case "number":
      return "integer";
    case "string[]":
      return "text[]";
    case "number[]":
      return "integer[]";
  }
}

function pgDefault(value: unknown): string {
  if (typeof value === "function") return "CURRENT_TIMESTAMP";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

function buildColumnDef(fieldName: string, field: FieldAttribute): string {
  const parts = [`"${fieldName}"`, pgType(field.type)];
  if (field.required) parts.push("not null");
  if (field.defaultValue !== undefined) parts.push(`default ${pgDefault(field.defaultValue)}`);
  if (field.unique) parts.push("unique");
  if (field.references) {
    parts.push(
      `references "${field.references.model}"("id")${
        field.references.onDelete ? ` on delete ${field.references.onDelete}` : ""
      }`,
    );
  }
  return parts.join(" ");
}

function buildCreateTableSQL(tableName: string, table: TableSchema): string {
  const lines = [
    `  "id" text primary key`,
    ...Object.entries(table.fields).map(([name, field]) => `  ${buildColumnDef(name, field)}`),
  ];
  return `create table if not exists "${tableName}" (\n${lines.join(",\n")}\n);`;
}

function buildIndexSQL(tableName: string, table: TableSchema): string[] {
  return (table.indexes ?? []).map((index) => {
    const cols = index.columns.map((c) => `"${c}"`).join(", ");
    return `create ${index.unique ? "unique " : ""}index if not exists "${index.name}" on "${tableName}" (${cols});`;
  });
}

async function main() {
  const { getSchema } = await import("better-auth/db");
  const { authOptions } = await import("@/lib/auth");
  const { Pool } = await import("pg");

  const schema = getSchema(authOptions) as unknown as Record<string, TableSchema>;
  const tables = Object.entries(schema).sort(([, a], [, b]) => a.order - b.order);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const { rows: existingTableRows } = await pool.query<{ table_name: string }>(
    `select table_name from information_schema.tables where table_schema = 'public'`,
  );
  const existingTables = new Set(existingTableRows.map((r) => r.table_name));

  const statements: string[] = [];

  for (const [tableName, table] of tables) {
    if (!existingTables.has(tableName)) {
      statements.push(buildCreateTableSQL(tableName, table));
      statements.push(...buildIndexSQL(tableName, table));
      continue;
    }

    const { rows: columnRows } = await pool.query<{ column_name: string }>(
      `select column_name from information_schema.columns where table_schema = 'public' and table_name = $1`,
      [tableName],
    );
    const existingColumns = new Set(columnRows.map((r) => r.column_name));

    for (const [fieldName, field] of Object.entries(table.fields)) {
      if (!existingColumns.has(fieldName)) {
        statements.push(
          `alter table "${tableName}" add column ${buildColumnDef(fieldName, field)};`,
        );
      }
    }
    statements.push(...buildIndexSQL(tableName, table));
  }

  if (statements.length === 0) {
    console.log("Nada para migrar — schema já está em dia.");
    await pool.end();
    return;
  }

  const sql = statements.join("\n\n");
  console.log(sql);

  await pool.query(sql);
  await pool.end();

  console.log(`\n${statements.length} instrução(ões) aplicada(s) com sucesso.`);
}

main().catch((error) => {
  console.error("Falha na migração:", error?.message ?? error);
  process.exitCode = 1;
});
