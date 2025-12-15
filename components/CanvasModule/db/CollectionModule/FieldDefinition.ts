// db/collections/FieldDefinition.ts

import { CollectionDomainError, CollectionFieldType } from "./types";

export interface FieldDefinitionProps {
  id: string;
  name: string;
  type: CollectionFieldType;
  isRequired?: boolean;
  description?: string;

  // object fields
  fields?: FieldDefinition[];

  // array fields
  elementType?: CollectionFieldType;
  elementFields?: FieldDefinition[]; // when elementType === "object"
}

export class FieldDefinition {
  id: string;
  name: string;
  type: CollectionFieldType;
  isRequired: boolean;
  description?: string;

  fields: FieldDefinition[];
  elementType?: CollectionFieldType;
  elementFields: FieldDefinition[];

  constructor(props: FieldDefinitionProps) {
    if (!props.name || !props.name.trim()) {
      throw new CollectionDomainError(
        "FIELD_NAME_REQUIRED",
        "Field name cannot be empty."
      );
    }

    this.id = props.id;
    this.name = props.name.trim();
    this.type = props.type;
    this.isRequired = props.isRequired ?? false;
    this.description = props.description;

    // nested object fields
    this.fields = props.fields ? [...props.fields] : [];

    // arrays
    this.elementType = props.elementType;
    this.elementFields = props.elementFields ? [...props.elementFields] : [];

    this.validate();
  }

  private validate() {
    if (this.type === "object") {
      if (this.elementType || this.elementFields.length > 0) {
        throw new CollectionDomainError(
          "OBJECT_FIELD_INVALID",
          "Object field cannot have elementType/elementFields."
        );
      }
    }

    if (this.type === "array") {
      if (!this.elementType) {
        throw new CollectionDomainError(
          "ARRAY_ELEMENT_TYPE_REQUIRED",
          `Array field "${this.name}" must define elementType.`
        );
      }
      if (this.elementType !== "object" && this.elementFields.length > 0) {
        throw new CollectionDomainError(
          "ARRAY_ELEMENT_FIELDS_INVALID",
          `Array field "${this.name}" can only have elementFields when elementType is "object".`
        );
      }
    }

    // optional: forbid nested "array of array" for now
    if (this.type === "array" && this.elementType === "array") {
      throw new CollectionDomainError(
        "ARRAY_OF_ARRAY_NOT_SUPPORTED",
        `Array of arrays is not supported yet for field "${this.name}".`
      );
    }
  }

  // Convenience helpers

  isObject(): boolean {
    return this.type === "object";
  }

  isArray(): boolean {
    return this.type === "array";
  }

  /** Object field: add a nested sub-field. */
  addSubField(field: FieldDefinition) {
    if (!this.isObject()) {
      throw new CollectionDomainError(
        "NOT_OBJECT_FIELD",
        `Field "${this.name}" is not an object; cannot add sub-field.`
      );
    }
    this.ensureUniqueName(this.fields, field.name);
    this.fields.push(field);
  }

  /** Object field: remove a nested sub-field by id. */
  removeSubField(fieldId: string) {
    if (!this.isObject()) return;
    const idx = this.fields.findIndex((f) => f.id === fieldId);
    if (idx === -1) return;
    this.fields.splice(idx, 1);
  }

  /** Object field: find a nested sub-field. */
  getSubField(fieldId: string): FieldDefinition | undefined {
    if (!this.isObject()) return undefined;
    return this.fields.find((f) => f.id === fieldId);
  }

  /** Array of objects: add nested element field. */
  addElementField(field: FieldDefinition) {
    if (!this.isArray() || this.elementType !== "object") {
      throw new CollectionDomainError(
        "NOT_OBJECT_ARRAY",
        `Field "${this.name}" is not an array of objects; cannot add elementField.`
      );
    }
    this.ensureUniqueName(this.elementFields, field.name);
    this.elementFields.push(field);
  }

  removeElementField(fieldId: string) {
    if (!this.isArray() || this.elementType !== "object") return;
    const idx = this.elementFields.findIndex((f) => f.id === fieldId);
    if (idx === -1) return;
    this.elementFields.splice(idx, 1);
  }

  getElementField(fieldId: string): FieldDefinition | undefined {
    if (!this.isArray() || this.elementType !== "object") return undefined;
    return this.elementFields.find((f) => f.id === fieldId);
  }

  private ensureUniqueName(list: FieldDefinition[], name: string) {
    const n = name.trim();
    if (list.some((f) => f.name === n)) {
      throw new CollectionDomainError(
        "FIELD_NAME_DUPLICATE",
        `Field name "${n}" is already used at this level.`
      );
    }
  }
}
