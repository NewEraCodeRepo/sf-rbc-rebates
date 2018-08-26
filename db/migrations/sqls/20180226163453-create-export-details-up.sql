CREATE TABLE export_details (
  id BIGSERIAL,
  started_at	timestamptz,
  finished_at	timestamptz,
  status text,
  number_of_items text,
  PRIMARY KEY(id)
);

COMMENT ON COLUMN export_details.id IS 'Unique ID of export';
COMMENT ON COLUMN export_details.started_at IS 'Time export started';
COMMENT ON COLUMN export_details.finished_at IS 'Time export finished';
COMMENT ON COLUMN export_details.status IS 'Export status';
COMMENT ON COLUMN export_details.number_of_items IS 'No. of items exported';
