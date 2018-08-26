UPDATE rebate_criteria
SET data = jsonb_set(data, '{rewardCalculation,unit}', data->'rewardType') - 'rewardType';
