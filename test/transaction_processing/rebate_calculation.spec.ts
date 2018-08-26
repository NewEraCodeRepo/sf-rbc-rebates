import { expect } from 'chai';
import 'mocha';
import { RebateCalculation } from "../../app/transaction_processing/rebate_calculation";
import mockTransactionForRebateriteria from "../fixtures/transaction_for_rebate_criteria";
import { ArithmeticOperation } from "../../app/interfaces/arithmetic_operation";
import { RewardType } from 'datapipeline-schemas/rebateManagementObject';

describe("RebateCalculation", () => {
  it("calculates absolute dollar deductions", () => {
    const transaction = mockTransactionForRebateriteria({ amount: '10.00' });

    const calculation = RebateCalculation.for(transaction, {
      operand: '-2.00',
      operation: ArithmeticOperation.Addition,
      unit: RewardType.Dollars
    });

    expect(calculation.amount.toFixed(2)).to.eq('2.00');
    expect(calculation.explanation).to
      .eq('Calculation: 2 dollars due');
  });

  it("calculates dollar multiplicative discounts ", () => {
    const transaction = mockTransactionForRebateriteria({ amount: '20.00' });

    const calculation = RebateCalculation.for(transaction, {
      operand: '-0.2',
      operation: ArithmeticOperation.Multiplication,
      unit: RewardType.Dollars
    });

    expect(calculation.amount.toFixed(2)).to.eq('4.00');
    expect(calculation.explanation).to
      .eq('Calculation: 0.2 * 20 dollars due');
  });

  it("calculates point additions ", () => {
    const transaction = mockTransactionForRebateriteria({ amount: '10.00' });

    const calculation = RebateCalculation.for(transaction, {
      operand: '20',
      operation: ArithmeticOperation.Addition,
      unit: RewardType.Points
    });

    expect(calculation.amount.toFixed(2)).to.eq('20.00');
    expect(calculation.explanation).to.eq('Calculation: 20 points due');
  });

  it("calculates a point multiplier ", () => {
    const transaction = mockTransactionForRebateriteria({ basePoints: 5 });

    const calculation = RebateCalculation.for(transaction, {
      operand: '2',
      operation: ArithmeticOperation.Multiplication,
      unit: RewardType.Points
    });

    expect(calculation.amount.toFixed(2)).to.eq('10.00');
    expect(calculation.explanation).to.eq('Calculation: 2 * 5 points due');
  });
});
