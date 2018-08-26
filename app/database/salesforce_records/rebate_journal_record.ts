import {Entity, PrimaryColumn, Column} from "typeorm";

/* tslint:disable: variable-name */
@Entity({ name: "report_myoffers_rebate_journal_record_v3__c", schema: "salesforce"})
export class RebateJournalRecord {
  @PrimaryColumn('integer')
  public id: number;

  @Column('text')
  public ucin_external_id__c: string;

  @Column('double precision')
  public base_points__c: number;

  @Column('double precision')
  public cc_credit_amount__c: number;

  @Column('character varying')
  public client_id__c: string;

  @Column('character varying')
  public currency__c: string;

  @Column('date')
  public fulfilled_date__c: Date | null;

  @Column('double precision')
  public fullfilled_wmresults__c: number | null;

  @Column('date')
  public instruction_sent_date__c: Date | null;

  @Column('character varying')
  public masked_client_account__c: string;

  @Column('character varying')
  public merchant_id__c: string;

  @Column('double precision')
  public offer_id__c: number;

  @Column('double precision')
  public pba_credit_amount__c: number;

  @Column('character varying')
  public product__c: string;

  @Column('date')
  public qualifying_transaction_date__c: Date | null;

  @Column('double precision')
  public qualifying_transaction_value__c: number;

  @Column('character varying')
  public rebate_status_v3__c: string;

  @Column('character varying')
  public rebate_transaction_id__c: string;

  @Column('double precision')
  public rebate_dollars__c: number;

  @Column('double precision')
  public rebate_points__c: number;

  @Column('character varying')
  public rebate_type__c: string;

  @Column('character varying')
  public transaction_type__c: string;
}
