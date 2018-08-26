import {Entity, PrimaryColumn, Column} from "typeorm";
import { ApplicationRecord } from "./application_record";
import {IObjectMap, IProductDocument} from "datapipeline-schemas/sharedData";

@Entity('rebate_criteria')
export class RebateCriteriaRecord extends ApplicationRecord {
  @PrimaryColumn('text')
  id: string;

  @Column('jsonb')
  data: any;

  @Column({ type: 'text', nullable: true })
  description_for_testing: string | null;

  @Column('integer')
  redemption_limit: number;

  @Column('text')
  redemption_limit_type: string;

  @Column('jsonb')
  eligible_products: IObjectMap<IProductDocument>;
}
