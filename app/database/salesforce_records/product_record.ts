import {Entity, PrimaryColumn, Column} from "typeorm";

/* tslint:disable: variable-name */
@Entity({name: "product__c", schema: "salesforce"})
export class ProductRecord {
    @PrimaryColumn('integer')
    id: number;

    @Column({type: 'character varying', length: 1300})
    product_code_external__c: string;

    @Column({type: 'character varying', length: 30})
    product_code__c: string;

    @Column({type: 'character varying', length: 18})
    sfid: string;

    @Column('boolean')
    isdeleted: boolean;
}
