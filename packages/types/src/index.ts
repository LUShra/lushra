export type Identifier = string;

export type Timestamp = string;

export type Environment =
  | "development"
  | "preview"
  | "production";

export type RecordStatus =
  | "active"
  | "inactive"
  | "pending"
  | "archived";

export interface BaseRecord {
  id: Identifier;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
