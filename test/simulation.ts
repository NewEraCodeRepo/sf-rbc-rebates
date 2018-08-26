import { Consumer } from "../app/consumer";
import simulators from "./simulators";

const SIMULATED_MESSAGE_INTERVAL_IN_SECS = 5;

const consumer = Consumer.start();
const logger = consumer.logger;

function simulateNextMessage() {
  const simulator = simulators.sample();
  const seed = simulators.seed();

  logger.info(
    "[SIMULATOR]",
    "Generating a random", simulator.name, "with seed", seed
  );

  consumer.receive(simulator.generate());

  setTimeout(simulateNextMessage, SIMULATED_MESSAGE_INTERVAL_IN_SECS * 1000);
}

simulateNextMessage();
