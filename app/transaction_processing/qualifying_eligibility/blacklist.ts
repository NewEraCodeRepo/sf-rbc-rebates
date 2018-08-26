import { QualifyingStrategy } from "../qualifying_strategy";

export class Blacklist {
  public static async doesAccept(
    context: QualifyingStrategy
  ) {
    const { logger, user } = context;

    logger.info('Checking against blacklisting');

    if (!user.isBlacklisted) {
      logger.info('Customer', user.id, 'is not blacklisted');
      return true;
    } else {
      logger.info('Customer', user.id, 'is blacklisted');
      return false;
    }
  }
}
