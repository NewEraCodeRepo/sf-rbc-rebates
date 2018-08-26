import boot from "../../config/boot";
import { UserLedgerRepository } from "../database/repositories/user_ledger_repository";


(async () => {
    
    const logger = console;
    // connect to databases
    logger.log("----------Partition creation starting--------------")
    await boot();

    // run create if not exists query
    logger.log("Creating table")
    try {
        await UserLedgerRepository.createNextMonthsTable();
    } catch (error) {
        logger.log("ERROR in creating partitioned table");
        logger.log("If this is that the table already exists, then everything is fine");
        logger.log(error);
    }

    // we're done
    logger.log("----------Partition creation done--------------")
    process.exit(0);
})();