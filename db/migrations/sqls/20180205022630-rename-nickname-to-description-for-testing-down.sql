/* Copy `description_to_testing` into a `nickname` property of the `data` JSONB */
UPDATE rebate_criteria SET
  data = data || ('{"nickname":' || to_json(description_for_testing) || '}')::jsonb;

ALTER TABLE rebate_criteria DROP CONSTRAINT unique_rebate_criteria_description_for_testing;
ALTER TABLE rebate_criteria DROP COLUMN description_for_testing;

ALTER TABLE accounts DROP CONSTRAINT unique_account_description_for_testing;
ALTER TABLE accounts RENAME COLUMN description_for_testing TO nickname;
