import { Column } from "typeorm";

// All records inherit from ApplicationRecord.
export abstract class ApplicationRecord {
  // This column is automatically populated by Postgres.
  @Column('timestamp with time zone', { nullable: false })
  inserted_at?: Date;
}
