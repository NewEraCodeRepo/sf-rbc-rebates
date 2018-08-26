import {Entity, Column, PrimaryGeneratedColumn} from "typeorm";
import { ApplicationRecord } from "./application_record";

@Entity('transaction_for_rebate_criteria')
export class TransactionForRebateCriteriaRecord extends ApplicationRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  transaction_id: string;

  @Column('text')
  account_id: string;

  @Column('text')
  user_id: string;

  @Column('text')
  rebate_criteria_id: string;

  @Column('text', { nullable: true })
  rebate_id: string | null;

  @Column('decimal', { precision: 18, scale: 2 })
  amount: string;

  @Column('timestamp with time zone')
  processed_at: any;

  @Column('integer', {nullable: true})
  processor_id: number | null;

  @Column('text')
  transaction_type: string;

  @Column('text')
  status: string;

  @Column('text')
  card: string;

  @Column('integer', { default: 0, nullable: false })
  base_points: number;

  @Column('text')
  card_type: string;

  @Column('timestamp with time zone', { nullable: false })
  transaction_date: Date;

  @Column('text')
  transaction_currency: string;

  @Column('text', { nullable: true })
  transaction_postal_code: string | null;

  @Column('text')
  product_code_external: string;

  @Column('boolean')
  is_manual: boolean;

  @Column('text')
  tsys_customer_id: string;

  @Column('boolean')
  refund_report_created: boolean;
}
