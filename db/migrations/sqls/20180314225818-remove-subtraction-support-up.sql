/*
  Turns the rewardCalculation from
    { "operand": "2", "operation": "subtraction" }
  into
    { "operand": "-2", "operation": "addition" }.
*/

UPDATE rebate_criteria
SET
 data = jsonb_set(
   data,
   '{rewardCalculation,operand}',
    to_jsonb(
      /*
        Parses the operand as a numeric value, flips the sign, and returns it
        as text.
      */
      ((data#>>'{rewardCalculation,operand}')::numeric * -1)::text
    )
  )
WHERE
  data#>>'{rewardCalculation,operation}' = 'subtraction';

UPDATE rebate_criteria
SET
  data = jsonb_set(data, '{rewardCalculation,operation}', '"addition"')
WHERE
  data#>>'{rewardCalculation,operation}' = 'subtraction';
