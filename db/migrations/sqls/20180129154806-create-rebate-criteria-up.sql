CREATE TABLE rebate_criteria (
    id	text,
    data	jsonb,
    PRIMARY KEY(id)
);

COMMENT ON COLUMN rebate_criteria.id IS 'Salesforce unique ID for the offer';
COMMENT ON COLUMN rebate_criteria.data IS 'Offer criteria needed to calculate rebates';
