import {RewardType} from "datapipeline-schemas/rebateManagementObject";
import { ArithmeticOperation } from "./arithmetic_operation";

export interface IRewardCalculation {
  operand: string; // e.g. '5.0'
  operation: ArithmeticOperation; // e.g. Addition
  unit: RewardType;
}
