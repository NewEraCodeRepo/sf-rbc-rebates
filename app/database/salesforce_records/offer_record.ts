import {Entity, PrimaryColumn, Column} from "typeorm";

@Entity({ name: "offer__c", schema: "salesforce"})
export class OfferRecord {
  @PrimaryColumn('text')
  id: number;
  
  @Column('text')
  offer_id__c: string;

  @Column('boolean')
  isdeleted: boolean;
  
  @Column('text')
  name: string;
  
  @Column('text')
  running_redemption_amount_v3__c: string | null;

  @Column('text')
  running_redemption_count__c: string | null;
  
  @Column('text')
  sfid: string;

}
