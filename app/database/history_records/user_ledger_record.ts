import {Entity, Column, PrimaryColumn} from "typeorm";

@Entity({ name: "userledger", schema: "history"})
export class UserLedgerRecord {
  @PrimaryColumn('text')
  user_id: string;

  @PrimaryColumn('timestamp with time zone')
  update_timestamp: string;

  @Column('jsonb')
  user_info: any;
}
