export interface IKafkaSettings {
  [key: string]: any;
  groupId: string;
  clientId: string;
  url: string;
}
