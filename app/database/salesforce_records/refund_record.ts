import {Entity, PrimaryColumn, Column} from "typeorm";

/* tslint:disable: variable-name */
@Entity({name: "report_myoffers_refund_v3__c", schema: "salesforce"})
export class RefundRecord {
    @PrimaryColumn('integer')
    public id: number;

    @Column('character varying')
    public client_account_number__c: string;

    @Column('character varying')
    public client_hash_srf__c: string;

    @Column('character varying')
    public merchant_id__c: string;

    @Column('double precision')
    public offerid__c: number;

    @Column('double precision')
    public transactionamount__c: number;

    @Column('date')
    public transaction_date__c: Date;

    @Column('character varying')
    public transaction_type__c: string;

}
