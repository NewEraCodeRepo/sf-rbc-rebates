import { expect } from 'chai';
import { ArithmeticOperation } from "../../app/interfaces/arithmetic_operation";
import { OfferBenefitToCustomer } from "../../app/interfaces/offer_benefit_to_customer";
import { RewardType } from 'datapipeline-schemas/rebateManagementObject';
import { RewardCalculationInterpretation } from '../../app/offer_import/reward_calculation_interpretation';

describe('RewardCalculationInterpretation', () => {
  it('handles "$ Off"', () => {
    const calculation = RewardCalculationInterpretation.from({
      rebateAmount: "18.12",
      benefitToCustomer: OfferBenefitToCustomer.DollarsOff
    });

    expect(calculation.operand).to.eq("-18.12");
    expect(calculation.operation).to.eq(ArithmeticOperation.Addition);
    expect(calculation.unit).to.eq(RewardType.Dollars);
  });

  it('handles "% Off in $"', () => {
    const calculation = RewardCalculationInterpretation.from({
      rebateAmount: "0.1",
      benefitToCustomer: OfferBenefitToCustomer.PercentageOffForDollars
    });

    expect(calculation.operand).to.eq("-0.1");
    expect(calculation.operation).to.eq(ArithmeticOperation.Multiplication);
    expect(calculation.unit).to.eq(RewardType.Dollars);
  });

  it('handles "Points Top Up"', () => {
    const calculation = RewardCalculationInterpretation.from({
      rebateAmount: "10",
      benefitToCustomer: OfferBenefitToCustomer.PointsTopUp
    });

    expect(calculation.operand).to.eq("10");
    expect(calculation.operation).to.eq(ArithmeticOperation.Addition);
    expect(calculation.unit).to.eq(RewardType.Points);
  });

  it('handles "% More Base Points"', () => {
    const calculation = RewardCalculationInterpretation.from({
      rebateAmount: "0.2",
      benefitToCustomer: OfferBenefitToCustomer.PercentageIncreaseForPoints
    });

    expect(calculation.operand).to.eq("0.2");
    expect(calculation.operation).to.eq(ArithmeticOperation.Multiplication);
    expect(calculation.unit).to.eq(RewardType.Points);
  });

  it('handles "x Times The Base Points"', () => {
    const calculation = RewardCalculationInterpretation.from({
      rebateAmount: "3",
      benefitToCustomer: OfferBenefitToCustomer.MultiplierForPoints
    });

    // Note: we're calculating the *new* points to be issued, not the *total*
    // points so a 3x multiplier translates to issuing a bonus of 2x the points.
    // Example: 3x = 5 base points + 2 x 5 points from rebate = 15 total points
    expect(calculation.operand).to.eq("3");
    expect(calculation.operation).to.eq(ArithmeticOperation.Multiplication);
    expect(calculation.unit).to.eq(RewardType.Points);
  });
});
