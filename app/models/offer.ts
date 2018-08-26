export interface IOffer {
    isDeleted: boolean;
    name: string;
    offerId: string;
    runningRedemptionAmount: string | null;
    runningRedemptionCount: string | null;
    sfId: string;
    id: string;
}
