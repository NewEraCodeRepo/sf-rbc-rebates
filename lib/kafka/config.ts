import { IKafkaSettings } from "../../lib/kafka/interfaces";
import {KafkaConfig} from "../../app/kafka/config";

const config: IKafkaSettings = {
  groupId: KafkaConfig.getGroupId(),
  clientId: KafkaConfig.getClientId(),
  url: KafkaConfig.getKafkaUrl(),
};

export default config;
