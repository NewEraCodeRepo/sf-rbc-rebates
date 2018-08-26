/* Replace with your SQL commands */
ALTER TABLE users
ADD COLUMN targeted_offer_ids text ARRAY NOT NULL DEFAULT '{}';

COMMENT ON COLUMN users.targeted_offer_ids IS 'Array of offers the user is targeted for';