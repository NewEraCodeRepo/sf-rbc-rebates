import { TransferStatus } from "../interfaces/transfer_status";

export interface ITransferDetails {
    id: number;
    startedAt: Date;
    finishedAt: Date | null;
    status: TransferStatus;
    numberOfItems: number;
}
