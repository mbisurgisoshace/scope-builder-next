// db/collections/CollectionSchema.ts
import { CollectionDomainError } from "./types";
import { CollectionDefinition } from "./CollectionDefinition";

export class CollectionSchema {
  private collections = new Map<string, CollectionDefinition>();

  addCollection(collection: CollectionDefinition) {
    if (this.collections.has(collection.id)) {
      throw new CollectionDomainError(
        "COLLECTION_ID_DUPLICATE",
        `Collection with id "${collection.id}" already exists.`
      );
    }
    // Optional: ensure name uniqueness across collections
    for (const c of this.collections.values()) {
      if (c.name === collection.name) {
        throw new CollectionDomainError(
          "COLLECTION_NAME_DUPLICATE",
          `Collection name "${collection.name}" is already used.`
        );
      }
    }
    this.collections.set(collection.id, collection);
  }

  removeCollection(collectionId: string) {
    this.collections.delete(collectionId);
  }

  getCollection(collectionId: string): CollectionDefinition | undefined {
    return this.collections.get(collectionId);
  }

  listCollections(): CollectionDefinition[] {
    return Array.from(this.collections.values());
  }
}
