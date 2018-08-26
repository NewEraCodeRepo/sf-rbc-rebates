import { IRebate } from '../../models/rebate';
import { RewardType } from 'datapipeline-schemas/rebateManagementObject';
import * as moment from 'moment';

// TODO - changed to interface values & remove unnecessary fields once MC updated.
const CARD_TYPE_NUMBERS = {
    credit_card: 1,
    checking_account: 2,
};

const REWARD_TYPE_NUMBERS = {
    dollars: 1,
    points: 2,
};

export class RebateExportSerializer {
    public static serialize(object: IRebate) {
        return {
            id: Number(object.id).toString(), // This is to clear off any leading zeroes, as required by RBC
            client_id: object.userId,
            offer_id: object.rebateCriteriaId,
            card: object.card,
            wmresult_id: object.qualifyingTransaction.id,
            status: object.status,
            qualified_on: moment(object.issuedAt).format('YYYYMMDDHHmmss'),
            qualified_trans_id: object.qualifyingTransaction.transactionId,
            rebate: object.rewardType === RewardType.Dollars ? object.amount : Math.ceil(parseFloat(object.amount)).toString(),
            rebate_type: REWARD_TYPE_NUMBERS[object.rewardType],
            fulfilled_on: null,
            fulfilled_trans_id: null,
            fulfilled_rebate: null,
            fulfilled_wmresult_id: null,
            card_type: CARD_TYPE_NUMBERS[object.cardType],
            instruction_sent_date: null,
            account_id: object.accountId,
        };
    }
}
