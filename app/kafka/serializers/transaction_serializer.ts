import { CardType } from "datapipeline-schemas/rebateManagementObject";
import { ITransactionDocument } from "datapipeline-schemas/sharedData";
import { TransactionStatus } from "datapipeline-schemas/rebateManagementObject";
import { TransactionType } from "datapipeline-schemas/rebateManagementObject";
// import { ITransactionForRebateCriteria } from "datapipeline-schemas/rebateManagementObject";

// TODO - If we use same event as datapipeline-schemas then we mightn't need this serializer. Move everything to schemas.
const CARD_TYPE = {
    credit: CardType.CreditCard,
    debit: CardType.CheckingAccount,
};

export class KafkaTransactionSerializer {
    public static serialize(object: ITransactionDocument) {
        return {
            // id: object.transactionId + "_" + object.offerId,
            transactionId: object.transactionId,
            accountId: object.accountId,
            userId: object.userId,
            rebateCriteriaId: object.offerId,
            rebateId: Number(object.rebateId).toString(),
            amount: object.amount.toString(),
            transactionType: object.type as TransactionType,
            card: object.card,
            basePoints: object.basePoints || 0,
            cardType: CARD_TYPE[object.cardType],
            transactionDate: object.transactionDate,
            transactionCurrency: object.currency,
            transactionPostalCode: object.postalCode,
            productCodeExternal: object.productCode,
            isManual: object.isManual,
            processedAt: null,
            status: TransactionStatus.Pending,
            tsysCustomerId: object.customerId
        };
    }
}
