import * as faker from "faker";
import {ProductRepository} from "../../app/database/repositories/product_repository";
import {IProduct} from "../../app/models/product";

export default function buildProduct(attributes: Partial<IProduct> = {}): IProduct {
  return {
    id: faker.random.number(2000),
    isDeleted: false,
    productCode: faker.random.alphaNumeric(10),
    productCodeExternal: faker.random.alphaNumeric(10),
    sfId: faker.random.alphaNumeric(17),
    ...attributes
  };
}

export async function createProduct(attributes: Partial<IProduct> = {}) {
  return await ProductRepository.insert(buildProduct(attributes));
}
