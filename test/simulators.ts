import * as faker from "faker";
import buildRebateCriteria from "./fixtures/rebate_criteria";

class Simulator {
  constructor(public name: string, public generate: () => void) {}
}

const SIMULATORS = [
  new Simulator("Rebate Criteria", buildRebateCriteria),
];

export default {
  seed(value = Math.floor(Math.random() * 10000)) {
    faker.seed(value);
    return value;
  },

  sample() {
    const randomSimulatorIndex = Math.floor(Math.random() * SIMULATORS.length);
    return SIMULATORS[randomSimulatorIndex];
  },

  find(name: string) {
    return SIMULATORS.find((simulator) => simulator.name === name);
  }
};
