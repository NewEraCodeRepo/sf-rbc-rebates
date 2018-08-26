import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { ApplicationRecord } from "./application_record";

@Entity('rebates')
export class RebateRecord extends ApplicationRecord {
    @PrimaryGeneratedColumn()
    id?: string;

    @Column('text')
    user_id: string;

    @Column('text')
    rebate_criteria_id: string;

    @Column('text')
    account_id: string;

    @Column('text')
    account_transaction_id: string;

    @Column('text', { nullable: true })
    fulfilled_transaction_id: string | null;

    @Column('timestamp with time zone', { nullable: true })
    fulfilled_date: Date | null;

    @Column('decimal', { precision: 18, scale: 2, nullable: true })
    fulfilled_amount: string | null;

    @Column('decimal', { precision: 18, scale: 2 })
    amount: string;

    @Column('text')
    reward_type: string;

    @Column('timestamp with time zone')
    issued_at: any;

    @Column('text')
    status: string;

    @Column('timestamp with time zone', { nullable: true })
    delivered_at: Date | null;

    @Column('timestamp with time zone')
    dispatched_at: Date;

    @Column('text')
    card: string;

    @Column('text')
    card_type: string;

    @Column('timestamp with time zone')
    last_mop_sync: Date | null;

    @Column('jsonb')
    qualifying_transaction: any;

    @Column('jsonb')
    fulfillment_transaction: any;
}
