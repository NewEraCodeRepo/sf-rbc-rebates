// Represents a snapshot of a user at a given point in time
export interface IUserLedger {
    userId: string;
    updateTimestamp: Date;
    targetedOffers: string[];
    linkedOffers: string[];
    isEnrolledToMyOffers: boolean;
}
