import * as chai from 'chai';
import * as moment from "moment";
const expect = chai.expect;
import { createUserLedger } from '../fixtures/user_ledger';
import { UserLedgerRepository } from '../../app/database/repositories/user_ledger_repository';
import { requiresDatabase } from '../support/database';
import { IUserLedger } from "../../app/models/user_ledger";
import {TestLogger} from "../support/test_logger";

describe('UserLedgerRepository', () => {

  requiresDatabase();

  let logger;

  beforeEach(async () => {
    logger = new TestLogger();
    const allUserLedgers = await UserLedgerRepository.findAll();
    allUserLedgers.forEach(async (userLedger) => {
      await UserLedgerRepository.bulkDeleteWhere({ user_id: userLedger.userId });
    });
  });

  it(`can insert and find a model`, async () => {
    const object = await createUserLedger({ userId: '42', updateTimestamp: new Date() }) as Partial<IUserLedger>;
    const found = await UserLedgerRepository.findAll({ user_id: '42' });

    // cant deep equal because of exact Datetime timings being off for updateTimestamp
    expect(found.length).to.equal(1);
    expect(found[0].isEnrolledToMyOffers).to.deep.eq(object.isEnrolledToMyOffers);
    expect(found[0].linkedOffers).to.deep.eq(object.linkedOffers);
    expect(found[0].targetedOffers).to.deep.eq(object.targetedOffers);
  });

  it(`can get the last model`, async () => {
    const object = await createUserLedger({ userId: '57' }) as Partial<IUserLedger>;

    const last = await UserLedgerRepository.last();
    expect(last).to.deep.eq(object);
  });

  it(`can get the state of the user at a given date`, async () => {
    const today = new Date();
    const yearAgo = new Date();
    const monthAgo = new Date();
    const yesterday = new Date();
    yearAgo.setFullYear(today.getFullYear() - 1);
    yearAgo.setSeconds(0);
    yearAgo.setMilliseconds(0);
    monthAgo.setMonth(today.getMonth() - 1);
    monthAgo.setSeconds(0);
    monthAgo.setMilliseconds(0);
    yesterday.setDate(today.getDate() - 1);
    yesterday.setSeconds(0);
    yesterday.setMilliseconds(0);

    const oneMonthAgoLedger = await createUserLedger({ userId: '42', updateTimestamp: monthAgo, isEnrolledToMyOffers: true, targetedOffers: ['MONTH'], linkedOffers: ['MONTH'] })  as Partial<IUserLedger>;
    const yesterdayLedger = await createUserLedger({ userId: '42', updateTimestamp: yesterday, isEnrolledToMyOffers: true, targetedOffers: ['YESTERDAY'], linkedOffers: ['YESTERDAY'] }) as Partial<IUserLedger>;

    const currentState = await UserLedgerRepository.getStateAtDate('42', new Date());
    logger.info(currentState);

    const yesterdayLedgerTargetedOffers = yesterdayLedger.targetedOffers !== undefined ? yesterdayLedger.targetedOffers[0] : null;
    const yesterdayLedgerLinkedOffers = yesterdayLedger.linkedOffers !== undefined ? yesterdayLedger.linkedOffers[0] : null;

    expect(currentState).to.exist;
    expect(currentState!.userId).to.eq(yesterdayLedger.userId);
    expect(currentState!.targetedOffers[0]).to.equal(yesterdayLedgerTargetedOffers);
    expect(currentState!.linkedOffers[0]).to.equal(yesterdayLedgerLinkedOffers);
    expect(currentState!.isEnrolledToMyOffers).to.eq(yesterdayLedger.isEnrolledToMyOffers);

    const twoDaysAgo = await UserLedgerRepository.getStateAtDate('42', moment().subtract(2, "days").toDate());

    const oneMonthAgoLedgerTargetedOffers = oneMonthAgoLedger.targetedOffers !== undefined ? oneMonthAgoLedger.targetedOffers[0] : null;
    const oneMonthAgoLedgerLinkedOffers = oneMonthAgoLedger.linkedOffers !== undefined ? oneMonthAgoLedger.linkedOffers[0] : null;

    expect(twoDaysAgo).to.exist;
    expect(twoDaysAgo!.userId).to.eq(oneMonthAgoLedger.userId);
    expect(twoDaysAgo!.targetedOffers[0]).to.equal(oneMonthAgoLedgerTargetedOffers);
    expect(twoDaysAgo!.linkedOffers[0]).to.equal(oneMonthAgoLedgerLinkedOffers);
    expect(twoDaysAgo!.isEnrolledToMyOffers).to.eq(oneMonthAgoLedger.isEnrolledToMyOffers);
  });

});
