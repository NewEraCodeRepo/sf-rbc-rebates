/* Renames `nickname` to `description_for_testing`. */

ALTER TABLE accounts
  RENAME COLUMN nickname TO description_for_testing;

ALTER TABLE accounts
  ADD CONSTRAINT unique_account_description_for_testing
  UNIQUE(description_for_testing);

ALTER TABLE rebate_criteria
  ADD COLUMN description_for_testing text;

ALTER TABLE rebate_criteria
  ADD CONSTRAINT unique_rebate_criteria_description_for_testing
  UNIQUE(description_for_testing);

UPDATE rebate_criteria
  SET
    /* Extract `nickname` into a separate `description_for_testing` field */
    description_for_testing =  data->>'nickname',

    /* Remove nickname from the `data` column  */
    data = data - 'nickname'
;
