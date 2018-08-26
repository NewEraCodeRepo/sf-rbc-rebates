CREATE SCHEMA salesforce;

CREATE TABLE salesforce.offer__c
(
    createddate TIMESTAMP,
    isdeleted BOOLEAN,
    name VARCHAR(80),
    systemmodstamp TIMESTAMP,
    offer_id__c VARCHAR(30),
    running_redemption_amount__c DOUBLE PRECISION,
    sfid VARCHAR(18),
    id INTEGER PRIMARY KEY NOT NULL,
    _hc_lastop VARCHAR(32),
    _hc_err TEXT
);