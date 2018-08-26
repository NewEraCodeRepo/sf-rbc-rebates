UPDATE rebate_criteria
SET data = jsonb_set(data, '{rewardType}', data->'rewardCalculation'->'unit');

UPDATE rebate_criteria
SET data->'rewardCalculation' = data->'rewardCalculation' - 'unit';
