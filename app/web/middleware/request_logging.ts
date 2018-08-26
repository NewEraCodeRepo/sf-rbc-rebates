import { Config } from "../../config";
import { requestId } from '../routes/support';

export default function(app, config: Config) {
  app.use((request, response, next) => {
    config.logger.info(
      `method=${request.method}`,
      `path=${request.originalUrl}`,
      `requestId=${requestId()}`
    );

    next();
  });
}
