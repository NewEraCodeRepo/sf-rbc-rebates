import {ProductRecord} from "../salesforce_records/product_record";
import {IProduct} from "../../models/product";

export class ProductSerializer {
  public static serialize(object: IProduct): ProductRecord {
      return {
          isdeleted: object.isDeleted,
          id: object.id,
          product_code__c: object.productCode,
          product_code_external__c: object.productCodeExternal,
          sfid: object.sfId,
    };
  }

  public static deserialize(record: ProductRecord): IProduct {
    return {
        isDeleted: record.isdeleted,
        id: record.id,
        productCode: record.product_code__c,
        productCodeExternal: record.product_code_external__c,
        sfId: record.sfid,
    };
  }
}
