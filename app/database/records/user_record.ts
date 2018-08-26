import {Entity, PrimaryColumn, Column} from "typeorm";
import { ApplicationRecord } from "./application_record";
import {ICreditCardProduct, IDDAProduct, IOptInFileOffer} from "datapipeline-schemas/userObject";

@Entity('users')
export class UserRecord extends ApplicationRecord {
  @PrimaryColumn('text')
  public id: string;

  @Column('text', { array: true, nullable: false })
  public linked_offer_ids: string[];

  @Column('text', { array: true, nullable: false })
  public targeted_offer_ids: string[];

  @Column('json')
  public opt_in_file_offers: IOptInFileOffer[];

  @Column('bool')
  public is_enrolled: boolean;

  @Column('bool')
  public is_blacklisted: boolean;

  @Column('jsonb')
  public credit_card_products: ICreditCardProduct[];

  @Column('jsonb')
  public debit_card_products: IDDAProduct[];
}
