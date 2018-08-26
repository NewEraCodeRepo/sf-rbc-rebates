
import environment from "../../config/environment";
import { addKafkaSSLSettings, defaultConsumerConfigBuilder, hasKafkaSSLEnabled, buildMetadataWriter,
    ICertFileMap, IConsumerConfiguration, toCertFiles, defaultProducerConfigBuilder, IProducerConfiguration,
    writeSSLFiles,
} from "datapipeline-lib";
import * as path from "path";
const options = environment.kafka;

export class KafkaConfig {
    public static getKafkaUrl() {
        return options.url;
    }

    public static getClientId() {
        return options.clientId;
    }

    public static getGroupId() {
        return options.groupId;
    }

    public static getCanonicalTopicNames() {
        return Object.keys(options.topics);
    }

    public static getTopicsToStream() {
        return this.getCanonicalTopicNames().filter((topic) => {
            return topic === "offers" || topic === "users" || topic === "transactions";
        });
    }

    public static getResolvedTopicNames() {
        return Object.values(options.topics).map((topic: { name: string }) => {
            return topic.name;
        });
    }

    public static getResolvedTopicName(canonicalTopicName) {
        const topic = options.topics[canonicalTopicName];

        if (!topic) {
            throw new Error(`Could not resolve topic named "${canonicalTopicName} (available: ${this.getResolvedTopicNames()})"`);
        }

        return topic.name;
    }

    // consumer config
    public static getDefaultConsumerConfig(topicName?: string): IConsumerConfiguration {

        const globalConfig = {
            'enable.auto.commit': options.autoCommit.toUpperCase() === 'FALSE' ? false : true
        };

        return defaultConsumerConfigBuilder(
            this.getKafkaUrl(),
            this.getClientId(),
            this.getGroupId() + ((topicName) ? '-' + topicName : ''),
            globalConfig
        );
    }

    // ssl consumer config
    public static getDefaultConsumerConfigWithSSL(topicName?: string): IConsumerConfiguration {
        const kafkaConfig = this.getDefaultConsumerConfig(topicName);

        if (hasKafkaSSLEnabled(process.env)) {
            // Get cert file paths
            const filePaths: ICertFileMap = toCertFiles(
                process.env, path.join(__dirname, ".."),
            );
            writeSSLFiles(filePaths);
            kafkaConfig.globalConfig = addKafkaSSLSettings(
                kafkaConfig.globalConfig, filePaths,
            );
        }

        return kafkaConfig;
    }

    // producer config
    public static getDefaultProducerConfig(): IProducerConfiguration {
        return defaultProducerConfigBuilder(
            this.getKafkaUrl(),
            this.getClientId(),
        );
    }

    // ssl producer config
    public static getDefaultProducerConfigWithSSL(): IProducerConfiguration {
        const kafkaConfig = this.getDefaultProducerConfig();

        if (hasKafkaSSLEnabled(process.env)) {
            // Get cert file paths
            const filePaths: ICertFileMap = toCertFiles(
                process.env, path.join(__dirname, ".."),
            );
            writeSSLFiles(filePaths);
            kafkaConfig.globalConfig = addKafkaSSLSettings(
                kafkaConfig.globalConfig, filePaths,
            );
        }
        return kafkaConfig;
    }

    public static getMetadataWriter() {
        return buildMetadataWriter(this.getClientId());
    }
}
