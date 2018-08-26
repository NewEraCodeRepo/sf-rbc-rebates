import { expect } from "chai";
import "mocha";
import * as moment from "moment-timezone";
import { RefundContext } from "../../app/transaction_processing/refund/context";
import mockTransactionForRebateCriteria from "../fixtures/transaction_for_rebate_criteria";
import mockRebateCriteria from "../fixtures/rebate_criteria";
import { TransactionType } from "datapipeline-schemas/rebateManagementObject";

describe("RefundValidation", () => {
    const transaction = mockTransactionForRebateCriteria({
        amount: "10.00",
        transactionType: TransactionType.Refund,
        userId: "USER-1"
    });

    it("tracks refund if within eligibility dates", async () => {
        const rebateCriteria = mockRebateCriteria({
            id: "OFFER-1",
            isRedeemable: true,
            refundPeriodInDays: 30,
            validFromDate: moment(new Date()).add(-10, "days"),
            validToDate: moment(new Date()).add(-9, "days"),
            hasBeenActivated: true,
        });

        const context = new RefundContext(transaction, rebateCriteria);
        expect(context.isTrackingRefunds).to.eq(true);
    });

    it("doesn't track refund if not within eligibility dates", async () => {
        const rebateCriteria = mockRebateCriteria({
            id: "OFFER-1",
            isRedeemable: true,
            refundPeriodInDays: 5,
            validFromDate: moment(new Date()).add(-10, "days"),
            validToDate: moment(new Date()).add(-9, "days"),
            hasBeenActivated: true,
        });

        const context = new RefundContext(transaction, rebateCriteria);
        expect(context.isTrackingRefunds).to.eq(false);
    });

    it("tracks refund if offer is redeemable", async () => {
        const rebateCriteria = mockRebateCriteria({
            id: "OFFER-1",
            isRedeemable: true,
            refundPeriodInDays: 30,
            validFromDate: moment(new Date()).add(-10, "days"),
            validToDate: moment(new Date()).add(-9, "days"),
            hasBeenActivated: true,
        });

        const context = new RefundContext(transaction, rebateCriteria);
        expect(context.isTrackingRefunds).to.eq(true);
    });

    it("doesn't track refund if offer is not redeemable", async () => {
        const rebateCriteria = mockRebateCriteria({
            id: "OFFER-1",
            isRedeemable: false,
            refundPeriodInDays: 30,
            validFromDate: moment(new Date()).add(-10, "days"),
            validToDate: moment(new Date()).add(-9, "days"),
            hasBeenActivated: true,
        });

        const context = new RefundContext(transaction, rebateCriteria);
        expect(context.isTrackingRefunds).to.eq(false);
    });

    it("tracks refund if offer was active at some point", async () => {
        const rebateCriteria = mockRebateCriteria({
            id: "OFFER-1",
            isRedeemable: true,
            refundPeriodInDays: 30,
            validFromDate: moment(new Date()).add(-10, "days"),
            validToDate: moment(new Date()).add(-9, "days"),
            hasBeenActivated: true,
        });

        const context = new RefundContext(transaction, rebateCriteria);
        expect(context.isTrackingRefunds).to.eq(true);
    });

    it("doesn't track refund if offer was never active", async () => {
        const rebateCriteria = mockRebateCriteria({
            id: "OFFER-1",
            isRedeemable: true,
            refundPeriodInDays: 30,
            validFromDate: moment(new Date()).add(-10, "days"),
            validToDate: moment(new Date()).add(-9, "days"),
            hasBeenActivated: false,
        });

        const context = new RefundContext(transaction, rebateCriteria);
        expect(context.isTrackingRefunds).to.eq(false);
    });
});
