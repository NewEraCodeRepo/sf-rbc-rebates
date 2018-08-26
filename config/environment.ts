import * as env from 'env-var';
import { config as readFromDotEnv } from 'dotenv';
import { URL } from 'url';

const config: { [key: string]: any } = {};

// The application environment (e.g. development, test, production)
config.env = env.get("NODE_ENV").asString() || "development";

if (config.env === "development") {
  readFromDotEnv();
}

// Project names
config.project = {
  name: env.get("PROJECT_NAME", "Rebate Management").asString(),
  identifier: env.get("PROJECT_IDENTIFIER", "rebate_management").asString(),
  heroku_identifier: env.get("HEROKU_IDENTIFIER", "heroku_connect").asString()
};

const projectIdentifierForEnv = `${config.project.identifier}_${config.env}`;
const herokuConnectIdentifier = `${config.project.identifier}_${config.project.heroku_identifier}_${config.env}`;

// Database settings
const defaultDatabaseUrl =
  `postgres://${projectIdentifierForEnv}@localhost/${projectIdentifierForEnv}`;
const defaultHerokuConnectUrl =
  `postgres://${herokuConnectIdentifier}@localhost/${herokuConnectIdentifier}`;

// RM should have the HC database from ETL attached to it, because the name of this url is unknown until it's created
// the value needs to be dynamically set
const herokuConnectDBConnectionName = env.get("ATTACHED_DB_URL_NAME", "HEROKU_CONNECT_URL").asString();

config.database = {
  // "default" schema, the standard RM database
  url: env.get("DATABASE_URL", defaultDatabaseUrl).asString(),
  // the Heroku Connect db connected to salesforce, in tests, this is the same db as the standard one, but a new schema
  herokuConnectUrl: config.env !== 'test' ?
      env.get(herokuConnectDBConnectionName, defaultHerokuConnectUrl).asString()  :
      env.get("DATABASE_URL", defaultDatabaseUrl).asString(),
  // the History database. in tests, this is the same db as the standard one, but a new schema
  historyUrl: env.get("DATABASE_URL", defaultDatabaseUrl).asString(),
  logging: env.get("DATABASE_LOGGING", "error").asString()
};

// Web UI settings
config.web = {
  port: env.get("PORT", "5001").asInt(),
  adminAuth: env.get("ADMIN_AUTH").asString()
};

// Kafka settings
function kafkaTopicName(name: string, defaultValue?: string) {
  const envVar = `${name.toUpperCase()}_TOPIC`;
  let value = defaultValue || name;

  if (config.env === "test") {
    value += "_test";
  }

  return env.get(envVar, value).asString();
}

config.kafka = {
  url: env.get("KAFKA_URL", "localhost:9092").asString(),

  groupId: env.get("KAFKA_CLIENT_GROUP_ID", `${projectIdentifierForEnv}-group`).asString(),

  clientId: env.get("KAFKA_CLIENT_ID", projectIdentifierForEnv).asString(),

  topics: {
    rebates: {
      name: kafkaTopicName("rebates")
    },
    offers: {
      name: kafkaTopicName("offers")
    },
    users: {
      name: kafkaTopicName("users"),
      flushMS: env.get("USERS_FLUSH_MS", "1000").asInt()
    },
    transactions: {
      name: kafkaTopicName("transactions")
    },
  },

  autoCommit: env.get("ENABLE_AUTO_COMMIT", "true").asString(),

  // These settings are specific to librdkafka. See:
  //  https://github.com/edenhill/librdkafka/blob/master/CONFIGURATION.md
  rdkafka: {
    // How many acknowledgements the leader broker must receive from ISR
    // (in-sync replica) brokers before responding to the request:
    // 0 = Broker does not send any response/ack to client
    // 1 = Only the leader broker will need to ack the message
    // -1 will block until message is committed by all ISRs
    'request.required.acks': env.get("KAFKA_REQUEST_ACKS", '1').asInt(),

    // Maximum time the broker may wait to fill the response with
    // fetch.min.bytes.
    'fetch.wait.max.ms': env.get("KAFKA_FETCH_MAX_WAIT_IN_MS", '10000').asInt(),

    // Minimum number of bytes the broker responds with. If fetch.wait.max.ms
    // expires the accumulated data will be sent to the client regardless of
    // this setting.
    'fetch.min.bytes': env.get("KAFKA_FETCH_MIN_BYTES", '1').asInt(),
  }
};

if (['development', 'test'].indexOf(config.env) >= 0) {
  // Add a special "debug" topic for development and testing
  config.kafka.topics.debug = {
    name: kafkaTopicName('debug')
  };

  // Process fetches as fast as possible
  config.kafka.rdkafka['fetch.wait.max.ms'] = 1;
  config.kafka.rdkafka['fetch.min.bytes'] = 1;
}

config.zookeeper = {
  url: env.get("ZOOKEEPER_URL", "localhost:2181").asString(),
};

// SFTP settings
const sftpConnectionUrl = new URL(
  env.get("SFTP_CONNECTION_URL", "sftp://user:password@localhost:36168").asString()
);

const sftpAlgorithms = env.get("SFTP_ALGORITHMS", "ssh-rsa,ssh-dss")
  .asString().split(',');

config.sftp = {
  connection: {
    host: sftpConnectionUrl.hostname,
    port: Number(sftpConnectionUrl.port),
    username: sftpConnectionUrl.username,
    password: decodeURIComponent(sftpConnectionUrl.password),
    algorithms: { serverHostKey: sftpAlgorithms },
  },

  files: {
    watchAndMatchImportZip: env.get(
      "SFTP_WATCH_AND_MATCH_IMPORT_ZIP_PATH",
      "/Export/MyOffers/wmresult/wmresult.zip"
    ).asString(),
    rebateResultsExportZip: env.get(
      "REBATE_RESULTS_ZIP_PATH",
      "/Import/MyOffers/rmresult/rmresult.zip"
    ).asString(),
  }
};

// Processing settings
config.transactionProcessing = {
  async: env.get('TRANSACTION_PROCESSING_ASYNC', 'false').asBool(),
  concurrency: env.get('WEB_CONCURRENCY', '1').asInt()
};

export default config;
