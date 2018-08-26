import * as moment from "moment";
import { UserLedgerRecord } from "../history_records/user_ledger_record";
import { UserLedgerSerializer } from "../serializers/user_ledger_serializer";
import { IUserLedger } from "../../models/user_ledger";
import { Repository } from "./repository";

class RepositoryForUserLedger extends Repository<IUserLedger> {
  constructor(record = UserLedgerRecord, serializer = UserLedgerSerializer) {
    super(record, serializer, 'history');
  }

  /**
   * Look up the user's information on the given datetime
   *
   * @param userId Id of the user to retrieve
   * @param lookupDate Date to look up the given state of the user
   */
  public async getStateAtDate(userId: string, lookupDate: Date) {

    // convert lookupDate to last possible time on that day
    const endOfDayString = moment(lookupDate).hour(23).minute(59).second(59).format('YYYY-MM-DD HH:mm:ss');

    // @TODO replace select statement with buildSelectQuery method.
    // Requires updating buildSelectQuery method
    // to accept the different timestamp comparison operator
    const rawUser = await this
          .connection
          .query(`
            SELECT DISTINCT ON(user_id) *
            FROM history.userledger ul
            WHERE ul.user_id = '${userId}'
                AND ul.update_timestamp <= to_timestamp('${endOfDayString}', 'YYYY-MM-DD HH24:MI:SS')::timestamp with time zone
            ORDER BY ul.user_id, ul.update_timestamp desc
          `);
    return UserLedgerSerializer.deserialize(rawUser[0]);
  }

  /**
   * Create a partitioned table for the next month if it doesn't yet exist. Should be scheduled on a monthly basis on the beginning
   * of the pervious month
   */
  public async createNextMonthsTable() {

    const base = moment().add(1, 'month');
    const nextYear = base.year();
    const nextMonth = base.month() + 1; // moment months are 0-based
    const nextMonthLastDay = base.daysInMonth();

    return await this
          .connection
          .query(`
            CREATE TABLE IF NOT EXISTS history.userledger_${nextYear}_${nextMonth} PARTITION OF history.userledger
              FOR VALUES FROM ('${nextYear}-${nextMonth}-01 00:00:00') TO ('${nextYear}-${nextMonth}-${nextMonthLastDay} 23:59:59.999999');

            CREATE INDEX user_history_index_${nextYear}_${nextMonth} on history.userledger_${nextYear}_${nextMonth} (user_id, update_timestamp desc);
          `);
  }

  /**
   * CONVENIENCE METHODS FOR TESTS AND UI
   * @TODO move partition methods to separate repo
   */

  /**
   * updateUserLedgerRecord
   *
   * Updates a record in a partitioned table by inserting a new one
   * with all of the changed values and then deleting the old one.
   * It's a single operation only used for tests so I went with this not
   * so elegant or performant solution
   *
   * @param {obj} user_id - user_id of record to update
   * @param {obj} update_timestamp - update_timestamp of record to update
   * @param {any} data any - updated values to insert
   * @returns {Promise<void>}
   */
  public async updateUserLedgerRecord({ user_id,  update_timestamp, data }) {

    // find unique record using user_id and update_timestamp
    const user = await this.findUserLedgerRecord({user_id, update_timestamp});

    // merge updated data with current user record data
    const newCriteria = Object.assign({}, user, data);

    // Insert new user record with updated data into ledger
    const ledgerUserRecord = UserLedgerSerializer.deserialize({
      user_id: user.userId,
      update_timestamp: newCriteria.updateTimestamp,
      user_info: {
        targeted_offers: newCriteria.targetedOffers,
        linked_offers: newCriteria.linkedOffers,
        is_enrolled: newCriteria.isEnrolledToMyOffers
      }
    });

    await this.insert(ledgerUserRecord);

    // delete old record
    await this.deleteUserLedgerRecord({user_id, update_timestamp});
  }

  /**
   * deleteAllUsersHistory
   *
   * Effectively deletes user records from the partitioned table
   *
   * @param {obj} user_id - user_id of records to delete
   * @returns {Promise<void>}
   */
  public async deleteAllUsersHistory({ user_id }) {
    const allUserLedgers = await this.findAll();
    allUserLedgers.forEach(async (userLedger) => {
      await this.bulkDeleteWhere({ user_id });
    });
  }

  /**
   * findUserLedgerRecord
   *
   * Finds distinct record using both primary keys
   *
   * @param {obj} user_id - user_id of record to find
   * @param {obj} update_timestamp - update_timestamp of record to find
   * @returns {Promise<IUserLedger>}
   */
  public async findUserLedgerRecord({ user_id,  update_timestamp}) {
    const rawUser = await this
      .connection
      .query(this.buildSelectQuery({user_id, update_timestamp, columns: "*"}));
    return UserLedgerSerializer.deserialize(rawUser[0]);
  }

  /**
   * deleteUserLedgerRecord
   *
   * Deletes distinct record using both primary keys
   *
   * @param {obj} user_id - user_id of record to delete
   * @param {obj} update_timestamp - update_timestamp of record to delete
   * @returns {Promise<IUserLedger>}
   */
  public async deleteUserLedgerRecord({ user_id,  update_timestamp}) {
    await this
      .connection
      .query(`DELETE FROM history.userledger uf WHERE uf.update_timestamp =
            (${this.buildSelectQuery({user_id, update_timestamp, columns: "ul.update_timestamp"})})
          `);
  }

  /**
   * buildSelectQuery
   *
   * Creates query for find and delete method
   *
   * @param {obj} user_id
   * @param {obj} update_timestamp
   * @param {obj} columns - columns to show in select statement
   * @returns {string}
   */
  private buildSelectQuery({ user_id,  update_timestamp, columns}) {
    return `SELECT DISTINCT ON(user_id) ${columns}
            FROM history.userledger ul
            WHERE ul.user_id = '${user_id}'
                AND ul.update_timestamp = to_timestamp('${update_timestamp}', 'YYYY-MM-DD HH24:MI:SS')::timestamp with time zone
            ORDER BY ul.user_id, ul.update_timestamp desc
          `;
  }

}

export const UserLedgerRepository = new RepositoryForUserLedger();
