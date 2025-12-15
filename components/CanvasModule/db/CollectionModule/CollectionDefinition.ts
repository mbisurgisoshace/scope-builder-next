// db/collections/CollectionDefinition.ts
import { FieldDefinition } from "./FieldDefinition";
import { CollectionDomainError, FieldPath } from "./types";

export interface CollectionDefinitionProps {
  id: string;
  name: string;
  fields?: FieldDefinition[];
  description?: string;
}

export class CollectionDefinition {
  id: string;
  name: string;
  description?: string;
  fields: FieldDefinition[];

  constructor(props: CollectionDefinitionProps) {
    if (!props.name || !props.name.trim()) {
      throw new CollectionDomainError(
        "COLLECTION_NAME_REQUIRED",
        "Collection name cannot be empty."
      );
    }

    this.id = props.id;
    this.name = props.name.trim();
    this.description = props.description;
    this.fields = props.fields ? [...props.fields] : [];
    this.ensureUniqueFieldNames(this.fields);
  }

  rename(newName: string) {
    if (!newName || !newName.trim()) {
      throw new CollectionDomainError(
        "COLLECTION_NAME_REQUIRED",
        "Collection name cannot be empty."
      );
    }
    this.name = newName.trim();
  }

  // ─────────────────────────────────────
  // Top-level fields
  // ─────────────────────────────────────

  addField(field: FieldDefinition) {
    this.ensureUniqueFieldNames([...this.fields, field]);
    this.fields.push(field);
  }

  removeField(fieldId: string) {
    const idx = this.fields.findIndex((f) => f.id === fieldId);
    if (idx === -1) return;
    this.fields.splice(idx, 1);
  }

  getField(fieldId: string): FieldDefinition | undefined {
    return this.fields.find((f) => f.id === fieldId);
  }

  // ─────────────────────────────────────
  // Nested fields via FieldPath
  // ─────────────────────────────────────

  /**
   * Find a nested field by path of ids, e.g. [userId, addressId, cityId].
   * Returns both the field and its parent field or collection.
   */
  getFieldByPath(path: FieldPath): {
    field: FieldDefinition;
    parentCollection: CollectionDefinition;
    parentField?: FieldDefinition;
  } | null {
    if (path.length === 0) return null;

    let currentParentField: FieldDefinition | undefined;
    let currentList = this.fields;
    let currentField: FieldDefinition | undefined;

    for (let i = 0; i < path.length; i++) {
      const id = path[i];
      currentField = currentList.find((f) => f.id === id);
      if (!currentField) return null;

      if (i < path.length - 1) {
        // descend into object or array-of-objects
        if (currentField.isObject()) {
          currentParentField = currentField;
          currentList = currentField.fields;
        } else if (
          currentField.isArray() &&
          currentField.elementType === "object"
        ) {
          currentParentField = currentField;
          currentList = currentField.elementFields;
        } else {
          return null;
        }
      }
    }

    if (!currentField) return null;
    return {
      field: currentField,
      parentCollection: this,
      parentField: currentParentField,
    };
  }

  addFieldAtPath(parentPath: FieldPath | null, field: FieldDefinition) {
    if (!parentPath || parentPath.length === 0) {
      // top-level
      this.addField(field);
      return;
    }

    const node = this.getFieldByPath(parentPath);
    if (!node) {
      throw new CollectionDomainError(
        "PARENT_FIELD_NOT_FOUND",
        `Parent field path [${parentPath.join(" > ")}] not found.`
      );
    }

    const parentField = node.field;

    if (parentField.isObject()) {
      parentField.addSubField(field);
      return;
    }

    if (parentField.isArray() && parentField.elementType === "object") {
      parentField.addElementField(field);
      return;
    }

    throw new CollectionDomainError(
      "INVALID_PARENT_TYPE",
      `Cannot add nested field under "${parentField.name}" (type: ${parentField.type}).`
    );
  }

  removeFieldAtPath(path: FieldPath) {
    if (path.length === 0) return;

    if (path.length === 1) {
      this.removeField(path[0]);
      return;
    }

    const parentPath = path.slice(0, -1);
    const targetId = path[path.length - 1];

    const parentNode = this.getFieldByPath(parentPath);
    if (!parentNode) return;

    const parentField = parentNode.field;

    if (parentField.isObject()) {
      parentField.removeSubField(targetId);
    } else if (parentField.isArray() && parentField.elementType === "object") {
      parentField.removeElementField(targetId);
    }
  }

  private ensureUniqueFieldNames(list: FieldDefinition[]) {
    const seen = new Set<string>();
    for (const f of list) {
      if (seen.has(f.name)) {
        throw new CollectionDomainError(
          "FIELD_NAME_DUPLICATE",
          `Field name "${f.name}" is duplicated at the top level of collection "${this.name}".`
        );
      }
      seen.add(f.name);
    }
  }
}
