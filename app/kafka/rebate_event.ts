import { RebateSetEvent, RebateSetEventSerde } from "datapipeline-schemas/events/rebateSetEvent";
import {IRebatePayload, TransactionStatus} from "datapipeline-schemas/rebateManagementObject";
import { EventNotification} from "../../lib/kafka/event_notification";
import {KafkaConfig} from "./config";
import * as Highland from "highland";
import environment from "../../config/environment";
import { ILoggable } from "../../app/interfaces/loggable";
const topics = environment.kafka.topics;
import { RebateRepository } from "../../app/database/repositories/rebate_repository";
import { IRecord } from "datapipeline-lib";

export class RebateEvent {

  public static async dispatch(rebateId: string, logger?: ILoggable) {
    try {
    await new RebateEvent(rebateId, logger).dispatch();
    } catch (e) {
      if (logger) {
        logger.error(`Rebate event dispatch error: ${JSON.stringify(e, null, "\t")}`);
      }
    }
  }

  constructor(
    public readonly rebateId: string,
    public readonly logger: ILoggable = console
  ) {}

  public async dispatch() {
    const rebate = await RebateRepository.findOrFail(this.rebateId);

    const fulfilledDate: any = rebate.fulfilledDate;
    const fulfilledTransactionId: any = rebate.fulfilledTransactionId;

    const payload: IRebatePayload = {
      id: rebate.id,
      userId: rebate.userId,
      accountId: rebate.accountId,
      offerId: rebate.rebateCriteriaId,
      amount: rebate.amount,
      rewardType: rebate.rewardType,
      fulfilledAt: fulfilledDate,
      issuedAt: rebate.issuedAt,
      qualifiedTransactionId: rebate.accountTransactionId,
      fulfilledTransactionId,
      status: rebate.status as TransactionStatus,
      qualifyingTransaction: rebate.qualifyingTransaction,
      fulfillmentTransaction: rebate.fulfillmentTransaction
    };

    try {
      return await this.stream(payload);
    } catch (e) {
      this.logger.error(`Rebate event dispatch error: ${JSON.stringify(e, null, "\t")}`);
    }

  }

  private async stream(payload: IRebatePayload): Promise<Highland.Stream<any>> {

    const clientId = KafkaConfig.getClientId();

    const serde: RebateSetEventSerde = new RebateSetEventSerde(clientId);

    return Highland([payload])
      .map(this.build)
      .map(serde.serialize)
      .map(async (message) => {
        const msg: IRecord = {
          value: message,
          key: payload.id
        };
        try {
          await EventNotification.dispatch(topics.rebates.name, msg);
        } catch (e) {
          this.logger.error(`Rebate event stream dispatch error: ${JSON.stringify(e, null, "\t")}`);
        }
      })
      .errors((err: Error) => {
        this.logger.error(`Rebate event stream dispatch error: ${JSON.stringify(err, null, "\t")}`);
      })
      .each((event: any) => {
        this.logger.debug(`RebateEvent: ${event}`);
      });
  }

  private build(payload: IRebatePayload): RebateSetEvent {
    return new RebateSetEvent(payload.id, payload);
  }

}
