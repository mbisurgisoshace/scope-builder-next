"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Shape as IShape } from "../../types";

import { useDbSchema } from "../../db/DbSchemaContext";
import { ShapeFrame, ShapeFrameProps } from "../../blocks/BlockFrame";
import { ColumnDefinition } from "../SqlModule/ColumnDefinition";
import { TableDefinition } from "../SqlModule/TableDefinition";
import { useRegisterToolbarExtras } from "../../blocks/toolbar/toolbarExtrasStore";

type Props = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
};

const COLUMN_TYPES: { label: string; value: ColumnDefinition["type"] }[] = [
  { label: "string", value: "string" },
  { label: "number", value: "number" },
  { label: "boolean", value: "boolean" },
  { label: "autoIncrement", value: "autoIncrement" },
];

function getFkLabel(
  col: ColumnDefinition,
  allTables: TableDefinition[]
): string | null {
  if (!col.foreignKey) return null;
  const t = allTables.find((tb) => tb.id === col.foreignKey!.tableId);
  const c = t?.columns.find((cc) => cc.id === col.foreignKey!.columnId);
  if (!t || !c) return "FK → ?";
  return `FK → ${t.name}.${c.name}`;
}

export const DbTableBlock: React.FC<Props> = (props) => {
  const { shape } = props;
  const { schema, service, refresh } = useDbSchema();

  // You can store dbTableId either on shape or in shape.data
  const dbTableId =
    (shape as any).dbTableId ?? (shape as any).data?.dbTableId ?? null;

  let table = dbTableId ? schema.getTable(dbTableId) : undefined;

  if (dbTableId && !table) {
    table = service.createTable({
      id: dbTableId,
      name: "new_table",
    });
    // bump UI so we see the new columns etc.
    refresh();
  }

  //const allTables = useMemo(() => schema.listTables(), [schema]);
  const allTables = service.listTables();
  const fkTargetTables = allTables.filter((t) => t.id !== dbTableId);

  const [newColName, setNewColName] = useState("");
  const [newColType, setNewColType] =
    useState<ColumnDefinition["type"]>("string");

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(table?.name ?? "new_table");

  useEffect(() => {
    if (table) setNameDraft(table.name);
  }, [table?.name]);

  const handleNameCommit = () => {
    if (!table) return;
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== table.name) {
      service.renameTable(table.id, trimmed);
      refresh();
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleNameCommit();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      if (table) setNameDraft(table.name);
      setIsEditingName(false);
    }
  };

  const handleAddColumn = () => {
    if (!table || !newColName.trim()) return;

    service.addColumn({
      tableId: table.id,
      name: newColName.trim(),
      type: newColType,
    });
    setNewColName("");
    refresh(); // notify React that schema changed
    setNewColType("string");
  };

  const handleTogglePK = (columnId: string) => {
    if (!table) return;
    service.setSinglePrimaryKey(table.id, columnId);
    refresh();
  };

  const handleDeleteColumn = (columnId: string) => {
    if (!table) return;
    service.removeColumn(table.id, columnId);
    refresh();
  };

  const toggleNullable = (col: ColumnDefinition) => {
    if (!table) return;
    if (col.isPrimaryKey) {
      // PK should not be nullable – ignore toggle or show future warning
      return;
    }
    service.updateColumn(table.id, col.id, {
      isNullable: !col.isNullable,
    });
    refresh();
  };

  const toggleUnique = (col: ColumnDefinition) => {
    if (!table) return;
    service.updateColumn(table.id, col.id, {
      isUnique: !col.isUnique,
    });
    refresh();
  };

  const [fkEdit, setFkEdit] = useState<{
    columnId: string;
    targetTableId: string | "";
    targetColumnId: string | "";
  } | null>(null);

  const startFkEdit = (col: ColumnDefinition) => {
    const cur = col.foreignKey;
    setFkEdit({
      columnId: col.id,
      targetTableId: cur?.tableId ?? "",
      targetColumnId: cur?.columnId ?? "",
    });
  };

  const cancelFkEdit = () => setFkEdit(null);

  const handleFkChangeTable = (tableId: string) => {
    setFkEdit((prev) =>
      prev ? { ...prev, targetTableId: tableId, targetColumnId: "" } : prev
    );
  };

  const handleFkChangeColumn = (columnId: string) => {
    setFkEdit((prev) => (prev ? { ...prev, targetColumnId: columnId } : prev));
  };

  const applyFkEdit = () => {
    if (!table || !fkEdit) return;
    const { columnId, targetTableId, targetColumnId } = fkEdit;
    if (!targetTableId || !targetColumnId) return;

    service.updateColumn(table.id, columnId, {
      foreignKey: { tableId: targetTableId, columnId: targetColumnId },
      isForeignKey: true,
    });
    refresh();
    setFkEdit(null);
  };

  const clearFkForColumn = (columnId: string) => {
    if (!table) return;
    service.updateColumn(table.id, columnId, {
      foreignKey: undefined,
      isForeignKey: false,
    });
    refresh();
    if (fkEdit?.columnId === columnId) setFkEdit(null);
  };

  useRegisterToolbarExtras(
    shape.id,
    () => (
      <>
        {/* your existing table toolbar controls (name, add column, etc.) */}

        {/* ── New: SQL / DDL button ───────────────────────────── */}
        <button
          className="px-2 py-1 rounded bg-gray-100 border text-xs"
          onClick={(e) => {
            e.stopPropagation();
            if (!dbTableId) return;

            try {
              const ddl = service.generateTableDDL(dbTableId);
              console.log(
                `\n--- DDL for table ${table?.name ?? dbTableId} ---\n${ddl}\n`
              );
            } catch (err) {
              console.error("Failed to generate DDL for table:", err);
            }
          }}
        >
          SQL (PG)
        </button>

        <button
          className="px-2 py-1 rounded bg-gray-100 border text-xs"
          onClick={(e) => {
            e.stopPropagation();
            if (!dbTableId) return;

            try {
              const ddl = service.generateTableDDL(dbTableId, "mysql");
              console.log(
                `\n--- DDL for table ${table?.name ?? dbTableId} ---\n${ddl}\n`
              );
            } catch (err) {
              console.error("Failed to generate DDL for table:", err);
            }
          }}
        >
          SQL (MySql)
        </button>
      </>
    ),
    [
      shape.id,
      dbTableId,
      table?.name,
      service,
      // plus any other deps you already pass here
    ]
  );

  const inner =
    !dbTableId || !table ? (
      <div className="w-full h-full flex items-center justify-center text-xs text-red-600 bg-red-50 border border-dashed border-red-300 rounded-lg">
        Missing <code className="px-1 bg-red-100 rounded">dbTableId</code> or
        table not found in schema.
      </div>
    ) : (
      <div className="w-full h-full bg-white rounded-xl shadow flex flex-col text-xs overflow-hidden">
        {/* Header */}
        <div className="px-2 py-1 border-b flex items-center justify-between bg-slate-50">
          {/* <span className="font-semibold truncate">{table.name}</span> */}
          <div
            className="flex items-center gap-1 min-w-0"
            onClick={(e) => e.stopPropagation()}
          >
            {isEditingName ? (
              <input
                autoFocus
                className="border rounded px-1 py-0.5 text-xs w-full bg-white"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={handleNameCommit}
                onKeyDown={handleNameKeyDown}
              />
            ) : (
              <button
                className="flex items-center gap-1 min-w-0"
                title="Rename table"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingName(true);
                }}
              >
                <span className="font-semibold truncate max-w-[140px]">
                  {table.name}
                </span>
                <span className="text-[10px] text-slate-400">✏️</span>
              </button>
            )}
          </div>
          <span className="text-[10px] text-slate-500">SQL table</span>
        </div>

        {/* Columns list */}
        <div className="flex-1 overflow-auto">
          {table.columns.map((col) => {
            const fkLabel = getFkLabel(col, allTables);
            const isEditingThisFk = fkEdit?.columnId === col.id;
            const targetTable =
              allTables.find((t) => t.id === fkEdit?.targetTableId) ?? null;

            const nullableLabel = col.isNullable ? "NULL" : "NOT NULL";
            const uniqueLabel = "UNIQUE";

            return (
              <div
                key={col.id}
                className="px-2 py-1 border-b flex flex-col gap-1 text-[11px]"
              >
                <div className="flex items-center gap-2">
                  {/* PK toggle */}
                  <button
                    className={`w-5 h-5 border rounded flex items-center justify-center text-[9px] shrink-0 ${
                      col.isPrimaryKey
                        ? "bg-amber-200 border-amber-400 text-amber-900"
                        : "bg-white border-slate-300 text-slate-500"
                    }`}
                    title="Toggle primary key"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePK(col.id);
                    }}
                  >
                    PK
                  </button>

                  {/* Column name */}
                  <span className="flex-1 truncate">{col.name}</span>

                  {/* Type badge */}
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700 shrink-0">
                    {col.type}
                  </span>

                  {/* FK badge (if present) */}
                  {fkLabel && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-[10px] text-emerald-700 border border-emerald-200 shrink-0">
                      {fkLabel}
                    </span>
                  )}

                  {/* FK edit button */}
                  <button
                    className={`w-5 h-5 rounded-full border text-[10px] shrink-0 flex items-center justify-center ${
                      isEditingThisFk
                        ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                        : "bg-white border-slate-300 text-slate-500 hover:bg-slate-50"
                    }`}
                    title={
                      col.foreignKey ? "Edit foreign key" : "Set foreign key"
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isEditingThisFk) {
                        cancelFkEdit();
                      } else {
                        startFkEdit(col);
                      }
                    }}
                  >
                    🔗
                  </button>

                  {/* Clear FK button (only if FK set) */}
                  {col.foreignKey && (
                    <button
                      className="w-5 h-5 rounded-full border border-transparent hover:border-red-300 text-[10px] text-red-500 shrink-0 flex items-center justify-center"
                      title="Clear foreign key"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFkForColumn(col.id);
                      }}
                    >
                      ⨯
                    </button>
                  )}

                  {/* Delete column */}
                  <button
                    className="w-5 h-5 rounded-full border border-transparent hover:border-red-300 text-[10px] text-red-500 shrink-0 flex items-center justify-center"
                    title="Delete column"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteColumn(col.id);
                    }}
                  >
                    ×
                  </button>
                </div>

                {/* SECOND ROW: constraints */}
                <div className="pl-7 pr-1 flex items-center gap-1">
                  <span className="text-[10px] text-slate-500 shrink-0">
                    Constraints
                  </span>

                  {/* Nullable */}
                  <button
                    className={[
                      "px-1.5 py-0.5 rounded-full border text-[10px] flex items-center gap-1",
                      col.isPrimaryKey
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                        : col.isNullable
                        ? "bg-sky-50 border-sky-300 text-sky-700"
                        : "bg-slate-100 border-slate-300 text-slate-700",
                    ].join(" ")}
                    title={
                      col.isPrimaryKey
                        ? "Primary key columns must be NOT NULL"
                        : "Toggle NULL / NOT NULL"
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!col.isPrimaryKey) toggleNullable(col);
                    }}
                  >
                    {nullableLabel}
                  </button>

                  {/* Unique */}
                  <button
                    className={[
                      "px-1.5 py-0.5 rounded-full border text-[10px] flex items-center gap-1",
                      col.isUnique
                        ? "bg-purple-50 border-purple-300 text-purple-700"
                        : "bg-slate-100 border-slate-300 text-slate-700",
                    ].join(" ")}
                    title="Toggle UNIQUE constraint"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleUnique(col);
                    }}
                  >
                    {uniqueLabel}
                  </button>
                </div>

                {/* FK inline editor row */}
                {isEditingThisFk && (
                  <div
                    className="mt-1 pl-5 pr-1 flex flex-col gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500 shrink-0">
                        References
                      </span>
                      <select
                        className="border rounded px-1 py-0.5 text-[10px] bg-white flex-1"
                        value={fkEdit?.targetTableId ?? ""}
                        onChange={(e) => handleFkChangeTable(e.target.value)}
                      >
                        <option value="">Select table…</option>
                        {fkTargetTables.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <select
                        className="border rounded px-1 py-0.5 text-[10px] bg-white flex-1"
                        value={fkEdit?.targetColumnId ?? ""}
                        onChange={(e) => handleFkChangeColumn(e.target.value)}
                        disabled={!targetTable}
                      >
                        <option value="">Select column…</option>
                        {targetTable?.columns.map((tc) => (
                          <option key={tc.id} value={tc.id}>
                            {tc.name}
                            {tc.isPrimaryKey ? " (PK)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-1">
                      <button
                        className="px-2 py-0.5 rounded bg-emerald-500 text-white text-[10px] shrink-0 disabled:opacity-40"
                        disabled={
                          !fkEdit?.targetTableId || !fkEdit?.targetColumnId
                        }
                        onClick={applyFkEdit}
                      >
                        Apply
                      </button>
                      <button
                        className="px-1 py-0.5 rounded text-[10px] text-slate-500 hover:bg-slate-100 shrink-0"
                        onClick={cancelFkEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {table.columns.length === 0 && (
            <div className="px-2 py-3 text-[11px] text-slate-400">
              No columns yet. Add one below.
            </div>
          )}
        </div>

        {/* Add column row */}
        <div className="px-2 py-1 border-t bg-slate-50 flex items-center gap-1">
          <input
            className="flex-1 border rounded px-1 py-0.5 text-[11px] bg-white"
            placeholder="column_name"
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <select
            className="border rounded px-1 py-0.5 text-[11px] bg-white"
            value={newColType}
            onChange={(e) =>
              setNewColType(e.target.value as ColumnDefinition["type"])
            }
            onClick={(e) => e.stopPropagation()}
          >
            {COLUMN_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <button
            className="px-2 py-0.5 rounded bg-blue-500 text-white text-[11px] shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              handleAddColumn();
            }}
          >
            +
          </button>
        </div>
      </div>
    );

  return (
    <ShapeFrame
      {...props}
      resizable={false}
      showConnectors={props.isSelected && props.selectedCount === 1}
    >
      {inner}
    </ShapeFrame>
  );
};
