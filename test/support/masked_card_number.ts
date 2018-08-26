import * as faker from "faker";

const CARD_MASK = '******';

export function randomZeroPaddedNumber(numDigits: number) {
  const num = faker.random.number(10 ** numDigits);
  return num.toString().padStart(numDigits, '0');
}

export const maskedCardNumber = [
  '3',
  randomZeroPaddedNumber(5),
  CARD_MASK,
  randomZeroPaddedNumber(4)
].join("");
