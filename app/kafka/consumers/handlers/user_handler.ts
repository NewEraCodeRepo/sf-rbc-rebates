import { UserSetEvent, UserSetEventSerde } from "datapipeline-schemas/events/userSetEvent";
import { IDelivery } from "datapipeline-lib";
import { ILoggable } from "../../../../app/interfaces/loggable";
import { UserRepository } from "../../../../app/database/repositories/user_repository";
import { KafkaUserSerializer } from "../../serializers/user_serializer";

export class UserHandler {
  public static matches(name: string) {
    return name === "users";
  }

  public static getEventSerde(clientId: string) {
    return new UserSetEventSerde(clientId);
  }

  public static async process(message: IDelivery<UserSetEvent>, logger: ILoggable) {
    if (message.event && message.event.user && !message.event.user.isAnonymous) {
      const userEvent = message.event.user;
      const userData = KafkaUserSerializer.serialize(userEvent);
      const userRecord = await UserRepository.upsert(userData);

      logger.info(`[RM status] - User upserted: ${userRecord.id}`);

      return userRecord;
    } else {
      logger.info(`[RM status] - User message invalid: ${JSON.stringify(message)}`);
    }
  }
}
