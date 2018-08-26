DROP TRIGGER IF EXISTS user_ledger_trigger ON "public"."users";
CREATE OR REPLACE FUNCTION user_ledger_trigger_fn()
  RETURNS TRIGGER AS
$$
DECLARE user_data_new jsonb;
DECLARE user_data_old jsonb;
BEGIN

  SELECT ('{"linked_offers":'
    ||array_to_json(NEW.linked_offer_ids)
    ||', "targeted_offers":'
    ||array_to_json(NEW.targeted_offer_ids)
    ||'}') into user_data_new;

  SELECT user_info into user_data_old
    FROM history.userledger where user_id = NEW.id order by update_timestamp desc limit 1;

  IF user_data_new != user_data_old OR user_data_old is null THEN
       INSERT INTO history.userledger AS ul (user_id, update_timestamp, user_info)
       VALUES (NEW.id, now(), user_data_new::jsonb);
  END IF;
  RETURN NEW;
END;
$$
LANGUAGE 'plpgsql';
CREATE TRIGGER user_ledger_trigger
  AFTER INSERT OR UPDATE
  ON users
  FOR EACH ROW
  EXECUTE PROCEDURE user_ledger_trigger_fn();
END;