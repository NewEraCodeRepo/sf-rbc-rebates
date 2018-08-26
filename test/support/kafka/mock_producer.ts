import { ILoggable } from "app/interfaces/loggable";
import { TestLogger } from "../test_logger";

export class MockKafkaProducer {

    private logger: ILoggable;

    constructor() {
        this.logger = new TestLogger();
    }

    public async dispatch(data: any) {
        return this.logger.info('SIMULATING DISPATCH OF: ', data);
    }

    public init() {
        return this.logger.info('BASE CLASS INIT');
    }
}
