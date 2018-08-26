import * as faker from "faker";

const DEFAULTS = { maxDigits: 5 };

export default function randomDemoId(config: { prefix?: string, maxDigits?: number }) {
  const options = { ...DEFAULTS, ...config };
  return `${options.prefix}${faker.random.number(options.maxDigits ** 10)}`;
}
