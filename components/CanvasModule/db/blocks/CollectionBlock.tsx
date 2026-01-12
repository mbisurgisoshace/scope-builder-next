"use client";

import React, { useState } from "react";
import { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../../blocks/BlockFrame";
import { useDbCollectionContext } from "../CollectionSchemaContext";
import { CollectionFieldType, FieldPath } from "../CollectionModule/types";
import { FieldDefinition } from "../CollectionModule/FieldDefinition";

type Props = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
};

export const DbCollectionBlock: React.FC<Props> = (props) => {
  const { shape } = props;
  const { schema, service, refresh } = useDbCollectionContext();

  // same idea as dbTableId for tables
  const dbCollectionId =
    (shape as any).dbCollectionId ??
    (shape as any).data?.dbCollectionId ??
    null;

  // Look up collection
  let collection = dbCollectionId
    ? schema.getCollection(dbCollectionId)
    : undefined;

  // If it's missing, create it now (once) with this id
  if (dbCollectionId && !collection) {
    const name =
      shape.cardTitle?.trim() || `Collection_${dbCollectionId.slice(0, 4)}`;

    collection = service.createCollection({
      id: dbCollectionId,
      name,
    });

    refresh(); // same as table block
  }

  // ─────────────────────────────
  // Header state
  // ─────────────────────────────
  const [nameDraft, setNameDraft] = useState(collection?.name || "");
  const [isEditingName, setIsEditingName] = useState(false);

  // ─────────────────────────────
  // Top-level field add state
  // ─────────────────────────────
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] =
    useState<CollectionFieldType>("string");

  // ─────────────────────────────
  // Nested child add state
  // ─────────────────────────────
  const [activeParentPath, setActiveParentPath] = useState<FieldPath | null>(
    null
  );
  const [newChildName, setNewChildName] = useState("");
  const [newChildType, setNewChildType] =
    useState<CollectionFieldType>("string");

  if (!dbCollectionId || !collection) {
    return (
      <ShapeFrame
        {...props}
        resizable={false}
        showConnectors={props.isSelected && props.selectedCount === 1}
      >
        <div className="w-full h-full flex items-center justify-center text-xs text-red-600 bg-red-50 border border-dashed border-red-300 rounded-lg">
          Missing{" "}
          <code className="px-1 bg-red-100 rounded">dbCollectionId</code> or
          collection not found in schema.
        </div>
      </ShapeFrame>
    );
  }

  const handleNameCommit = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === collection.name) {
      setIsEditingName(false);
      setNameDraft(collection.name);
      return;
    }
    try {
      service.renameCollection(collection.id, trimmed);
      refresh();
    } catch (err) {
      console.error("Failed to rename collection", err);
      // reset on error
      setNameDraft(collection.name);
    }
    setIsEditingName(false);
  };

  const handleAddTopField = () => {
    const trimmed = newFieldName.trim();
    if (!trimmed) return;

    service.addField({
      collectionId: collection.id,
      name: trimmed,
      type: newFieldType,
      isRequired: false,
    });

    setNewFieldName("");
    setNewFieldType("string");
    refresh();
  };

  const isPathEqual = (a: FieldPath | null, b: FieldPath): boolean => {
    if (!a) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  };

  // ─────────────────────────────
  // Recursive field renderer
  // ─────────────────────────────
  function renderField(
    field: FieldDefinition,
    path: FieldPath,
    depth: number = 0
  ) {
    const isObject = field.isObject();
    const indent = depth * 12; // px left padding
    const isAddingChildHere = isPathEqual(activeParentPath, path);

    return (
      <div key={field.id} className="border-b px-2 py-1 text-[11px]">
        {/* main row */}
        <div
          className="flex items-center gap-2"
          style={{ paddingLeft: indent }}
        >
          {/* tiny tree marker for nested */}
          {depth > 0 && (
            <span className="w-3 text-slate-400 select-none">•</span>
          )}

          {/* field name (editable) */}
          <input
            className="flex-1 bg-transparent outline-none"
            value={field.name}
            onChange={(e) => {
              service.updateField(collection!.id, path, {
                name: e.target.value,
              });
              refresh();
            }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* type select (includes object) */}
          <select
            className="border rounded px-1 py-0.5 bg-white text-[11px]"
            value={field.type}
            onChange={(e) => {
              const nextType = e.target.value as CollectionFieldType;
              service.updateField(collection!.id, path, { type: nextType });
              refresh();
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="string">string</option>
            <option value="number">number</option>
            <option value="boolean">boolean</option>
            <option value="autoIncrement">autoIncrement</option>
            <option value="object">object</option>
            {/* later: array, date, etc. */}
          </select>

          {/* required toggle */}
          <button
            className={[
              "px-1.5 py-0.5 rounded-full border text-[10px]",
              field.isRequired
                ? "bg-amber-50 border-amber-300 text-amber-700"
                : "bg-slate-100 border-slate-300 text-slate-700",
            ].join(" ")}
            onClick={(e) => {
              e.stopPropagation();
              service.updateField(collection!.id, path, {
                isRequired: !field.isRequired,
              });
              refresh();
            }}
          >
            {field.isRequired ? "required" : "optional"}
          </button>

          {/* if object => add property button */}
          {isObject && (
            <button
              className="px-1.5 py-0.5 rounded bg-blue-50 text-[10px] text-blue-700 border border-blue-200"
              onClick={(e) => {
                e.stopPropagation();
                setActiveParentPath(path);
                setNewChildName("");
                setNewChildType("string");
              }}
            >
              + property
            </button>
          )}

          {/* delete field */}
          <button
            className="w-5 h-5 rounded-full text-[10px] text-red-500 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              service.removeField(collection!.id, path);
              refresh();
            }}
          >
            ×
          </button>
        </div>

        {/* inline add child row */}
        {isObject && isAddingChildHere && (
          <div
            className="mt-1 flex items-center gap-1 pl-[28px] pr-2"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              className="flex-1 border rounded px-1 py-0.5 text-[11px] bg-white"
              placeholder="property_name"
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
            />
            <select
              className="border rounded px-1 py-0.5 text-[11px] bg-white text-[11px]"
              value={newChildType}
              onChange={(e) =>
                setNewChildType(e.target.value as CollectionFieldType)
              }
            >
              <option value="string">string</option>
              <option value="number">number</option>
              <option value="boolean">boolean</option>
              <option value="autoIncrement">autoIncrement</option>
              <option value="object">object</option>
            </select>
            <button
              className="px-2 py-0.5 rounded bg-blue-500 text-white text-[11px]"
              onClick={() => {
                if (!newChildName.trim()) return;
                service.addField({
                  collectionId: collection!.id,
                  parentPath: path, // nested under this object
                  name: newChildName.trim(),
                  type: newChildType,
                });
                setNewChildName("");
                setNewChildType("string");
                setActiveParentPath(null);
                refresh();
              }}
            >
              Add
            </button>
            <button
              className="px-1 py-0.5 text-[11px] text-slate-500 hover:bg-slate-100 rounded"
              onClick={() => {
                setActiveParentPath(null);
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* recurse into children if object */}
        {isObject &&
          field.fields.map((child) =>
            renderField(child, [...path, child.id], depth + 1)
          )}
      </div>
    );
  }

  // ─────────────────────────────
  // Layout
  // ─────────────────────────────
  const inner = (
    <div className="w-full h-full bg-white rounded-xl shadow flex flex-col text-xs overflow-hidden">
      {/* Header */}
      <div className="px-2 py-1 border-b flex items-center justify-between bg-slate-50">
        <div
          className="flex items-center gap-1 min-w-0"
          onClick={(e) => e.stopPropagation()}
        >
          {isEditingName ? (
            <input
              autoFocus
              className="border rounded px-1 py-0.5 text-xs bg-white min-w-0"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={handleNameCommit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleNameCommit();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setNameDraft(collection.name);
                  setIsEditingName(false);
                }
              }}
            />
          ) : (
            <button
              className="flex items-center gap-1 min-w-0"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingName(true);
              }}
            >
              <span className="font-semibold truncate max-w-[140px]">
                {collection.name}
              </span>
              <span className="text-[10px] text-slate-400">✏️</span>
            </button>
          )}
        </div>
        <span className="text-[10px] text-slate-500">Collection</span>
      </div>

      {/* Fields list */}
      <div className="flex-1 overflow-auto">
        {collection.fields.map((f) => renderField(f, [f.id], 0))}

        {collection.fields.length === 0 && (
          <div className="px-2 py-3 text-[11px] text-slate-400">
            No fields yet. Add one below.
          </div>
        )}
      </div>

      {/* Add top-level field row */}
      <div
        className="px-2 py-1 border-t bg-slate-50 flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          className="flex-1 border rounded px-1 py-0.5 text-[11px] bg-white"
          placeholder="field_name"
          value={newFieldName}
          onChange={(e) => setNewFieldName(e.target.value)}
        />
        <select
          className="border rounded px-1 py-0.5 text-[11px] bg-white"
          value={newFieldType}
          onChange={(e) =>
            setNewFieldType(e.target.value as CollectionFieldType)
          }
        >
          <option value="string">string</option>
          <option value="number">number</option>
          <option value="boolean">boolean</option>
          <option value="autoIncrement">autoIncrement</option>
          <option value="object">object</option>
        </select>
        <button
          className="px-2 py-0.5 rounded bg-blue-500 text-white text-[11px]"
          onClick={handleAddTopField}
        >
          + Field
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
