CREATE TABLE accounts (
    id	text,
    nickname	text,
    PRIMARY KEY(id)
);

COMMENT ON COLUMN accounts.id IS 'Unique ID for the account';
COMMENT ON COLUMN accounts.nickname IS 'Nickname for the account';
