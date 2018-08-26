import {Repository} from "./repository";
import {ProductRecord} from "../salesforce_records/product_record";
import {ProductSerializer} from "../serializers/product_serializer";
import {IProduct} from "../../models/product";

class RepositoryForProducts extends Repository<IProduct> {
    constructor(record = ProductRecord, serializer = ProductSerializer) {
        super(record, serializer, 'heroku_connect');
    }

    public async getProductFromProductCodeExternal(code: string): Promise<IProduct | null> {
        const product = await this.findAll({
            where: {
                product_code_external__c: code,
                isdeleted: false,
            },
            join: {
                alias: 'entity'
            },
            take: 1,
        });

        if (product.length) {
            return product[0];
        }

        return null;
    }
}

export const ProductRepository = new RepositoryForProducts();
