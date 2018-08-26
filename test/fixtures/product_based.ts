import * as faker from "faker";
import { randomEnumValue } from "../support/random_enum_value";
import { IProductDocument, IObjectMap, OwnershipType } from "datapipeline-schemas/sharedData";
import {ProductType, ICreditCardProduct, IDDAProduct, IOptInFileOffer} from "datapipeline-schemas/userObject";

export default function createEligibleProduct(attributes: Partial<IProductDocument> = {})
    : IObjectMap<IProductDocument> {
    const id = `A${faker.random.uuid()}`;

    const returnVal = {};
    let productCode;
    let ownershipType;
    const productType = attributes.productTypeExternal || randomEnumValue(ProductType);

    if (productType === ProductType.CreditCard) {
        productCode = createCreditCardProductCode();
        ownershipType = createCreditCardOwnershipType();
    } else {
        productCode = createDebitCardProductCode();
        ownershipType = createDebitCardOwnershipType();
    }

    returnVal[id] = {
        id,
        name: faker.random.alphaNumeric(10),
        basePoints: faker.random.number(200),
        productCode,
        tlpCurrency: faker.random.alphaNumeric(3),
        productNameFr: faker.random.alphaNumeric(10),
        ddaAccountTypeCode: null,
        ddaServiceFeeOption: null,
        productCodeExternal: productCode,
        productTypeExternal: productType,
        isEligibleForMyOffers: faker.random.boolean(),
        ddaAccountClassificationCode: null,
        redeemableOwnershipType: [ownershipType],
        presentableOwnershipType: [ownershipType],
        ...attributes
    };

    return returnVal;
}

export function createCreditCardProductCode() {
    return faker.random.arrayElement(['CC_TEST_CODE']);
}

export function createDebitCardProductCode() {
  return faker.random.arrayElement(['DDA_TEST_CODE']);
}

export function createCreditCardOwnershipType() {
    return faker.random.arrayElement(
      [OwnershipType.Primary, OwnershipType.CoApplicant, OwnershipType.AuthorizedUser]);
}

export function createDebitCardOwnershipType() {
    return faker.random.arrayElement(
      [OwnershipType.Sole, OwnershipType.Joint]);
}

export function createCreditCardProduct(attributes: Partial<ICreditCardProduct> = {}): ICreditCardProduct {
    return {
        code: createCreditCardProductCode(),
        ownershipType: randomEnumValue(OwnershipType),
        accountId: `A_TEST_ACCOUNT`,
        customerId: `C${faker.random.uuid()}`,
        isEligibleClientProduct: '1',
        primaryAccountHashSRF: `P${faker.random.uuid()}`,
        ...attributes
    };
}

export function createDebitCardProduct(attributes: Partial<IDDAProduct> = {}): IDDAProduct {
    return {
        code: createDebitCardProductCode(),
        ownershipType: randomEnumValue(OwnershipType),
        accountId: `A_TEST_ACCOUNT`,
        customerId: `C${faker.random.uuid()}`,
        isEligibleClientProduct: '1',
        ...attributes
    };
}

export function createOptInFileOffer(attributes: Partial<IOptInFileOffer> = {}): IOptInFileOffer {
    return {
        type: randomEnumValue(ProductType),
        tsysCustomerId: `C${faker.random.uuid()}`,
        tsysAccountId: `A${faker.random.uuid()}`,
        offers: [],
        campaignId: "",
        ...attributes
    };
}

export async function createEligibleProductList(attributes: Partial<IProductDocument> = {}) {
    return createEligibleProduct(attributes);
}
