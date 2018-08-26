import environment from "../../../config/environment";
import * as shell from "shelljs";

export class DeleteKafkaTopics {

  public run(topic) {
    return new Promise ((resolve, reject) => {
      const KAFKA_TOPICS_COMMAND = 'kafka-topics';
      const KAFKA_CONFIG_COMMAND = 'kafka-configs';
      const ZOOKEEPER_URL = environment.zookeeper.url;
      const DELETE_TOPIC = `${KAFKA_TOPICS_COMMAND} --zookeeper ${ZOOKEEPER_URL} --delete --topic ${topic}`;
      const RESET_TOPIC_PROCESS = `${DELETE_TOPIC}`;

      if (!shell.which(KAFKA_TOPICS_COMMAND)) {
        shell.echo(`Sorry, this script requires ${KAFKA_TOPICS_COMMAND}`);
        shell.exit(1);
      }

      if (!shell.which(KAFKA_CONFIG_COMMAND)) {
        shell.echo(`Sorry, this script requires ${KAFKA_TOPICS_COMMAND}`);
        shell.exit(1);
      }

      shell.exec(RESET_TOPIC_PROCESS, (code, stdout, stderr) => {
        if (code !== 0) {
          reject(stderr);
        }
        resolve(stdout);
      });

    });
  }
}
