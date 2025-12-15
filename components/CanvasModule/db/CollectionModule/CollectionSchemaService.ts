// db/collections/CollectionSchemaService.ts
import { FieldDefinition } from "./FieldDefinition";
import { CollectionSchema } from "./CollectionSchema";
import { CollectionFieldType, FieldPath } from "./types";
import { CollectionDefinition } from "./CollectionDefinition";

export interface CreateCollectionOptions {
  id?: string;
  name: string;
  description?: string;
}

export interface CreateFieldOptions {
  collectionId: string;
  parentPath?: FieldPath | null; // null / undefined = top-level
  id?: string;
  name: string;
  type: CollectionFieldType;
  isRequired?: boolean;
  description?: string;

  elementType?: CollectionFieldType; // for array
}

export interface UpdateFieldOptions {
  name?: string;
  type?: CollectionFieldType;
  isRequired?: boolean;
  description?: string;
}

export class CollectionSchemaService {
  private schema: CollectionSchema;
  private generateId: () => string;

  constructor(schema: CollectionSchema, generateId?: () => string) {
    this.schema = schema;
    this.generateId = generateId ?? (() => crypto.randomUUID());
  }

  // ─────────────────────────────────────────────
  // COLLECTIONS
  // ─────────────────────────────────────────────

  createCollection(opts: CreateCollectionOptions): CollectionDefinition {
    const id = opts.id ?? this.generateId();
    const collection = new CollectionDefinition({
      id,
      name: opts.name,
      description: opts.description,
      fields: [],
    });
    this.schema.addCollection(collection);
    return collection;
  }

  deleteCollection(collectionId: string): void {
    this.schema.removeCollection(collectionId);
  }

  renameCollection(collectionId: string, newName: string): void {
    const col = this.schema.getCollection(collectionId);
    if (!col) {
      throw new Error(`Collection ${collectionId} not found`);
    }
    col.rename(newName);
  }

  listCollections(): CollectionDefinition[] {
    return this.schema.listCollections();
  }

  getCollection(collectionId: string): CollectionDefinition | undefined {
    return this.schema.getCollection(collectionId);
  }

  // ─────────────────────────────────────────────
  // FIELDS
  // ─────────────────────────────────────────────

  addField(opts: CreateFieldOptions): FieldDefinition {
    const collection = this.schema.getCollection(opts.collectionId);
    if (!collection) {
      throw new Error(`Collection ${opts.collectionId} not found`);
    }

    const id = opts.id ?? this.generateId();
    const field = new FieldDefinition({
      id,
      name: opts.name,
      type: opts.type,
      isRequired: opts.isRequired,
      description: opts.description,
      elementType: opts.elementType,
    });

    collection.addFieldAtPath(opts.parentPath ?? null, field);
    return field;
  }

  removeField(collectionId: string, path: FieldPath): void {
    const collection = this.schema.getCollection(collectionId);
    if (!collection) {
      throw new Error(`Collection ${collectionId} not found`);
    }
    collection.removeFieldAtPath(path);
  }

  updateField(
    collectionId: string,
    path: FieldPath,
    updates: UpdateFieldOptions
  ): void {
    const collection = this.schema.getCollection(collectionId);
    if (!collection) {
      throw new Error(`Collection ${collectionId} not found`);
    }

    const node = collection.getFieldByPath(path);
    if (!node) {
      throw new Error(
        `Field at path [${path.join(" > ")}] not found in collection ${
          collection.name
        }`
      );
    }

    const field = node.field;

    if (updates.name !== undefined) field.name = updates.name.trim();
    if (updates.type !== undefined) field.type = updates.type;
    if (updates.isRequired !== undefined) field.isRequired = updates.isRequired;
    if (updates.description !== undefined)
      field.description = updates.description;

    // You could re-run a validation method here if you add one to FieldDefinition
  }
}
