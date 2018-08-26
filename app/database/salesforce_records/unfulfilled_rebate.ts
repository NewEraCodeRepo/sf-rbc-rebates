import {Entity, PrimaryColumn, Column} from "typeorm";

/* tslint:disable: variable-name */
@Entity({name: "report_myoffers_unfulfilled_rebate_v3__c", schema: "salesforce"})
export class UnfulfilledRebateRecord {
    @PrimaryColumn('integer')
    public id: number;

    @Column('character varying')
    public currency__c: string;

    @Column('date')
    public instruction_sent_date__c: Date | null;

    @Column('character varying')
    public masked_client_account__c: string;

    @Column('double precision')
    public merchant_id__c: number;

    @Column('double precision')
    public offer_id__c: number;

    @Column('date')
    public qualifying_transaction_date__c: Date;

    @Column('double precision')
    public qualifying_transaction_value__c: number;

    @Column('character varying')
    public rebate_status_v3__c: string;

    @Column('character varying')
    public rebate_transaction_id__c: string;

    @Column('character varying')
    public rebate_type__c: string;

    @Column('character varying')
    public transaction_type__c: string;

    @Column('character varying')
    public unfulfilled_days__c: number;

    @Column('double precision')
    public rebate__c: number;
}
