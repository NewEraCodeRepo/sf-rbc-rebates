CREATE TABLE users (
  id text PRIMARY KEY,

  -- Default to an empty array
  linked_offer_ids text ARRAY NOT NULL DEFAULT '{}'
);
