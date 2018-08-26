import * as context from "express-http-context";
import { Config } from "../../config";
import * as uuid from "uuid/v1";

// HTTP header to read request ID from (falls back to a UUID if not present)
const REQUEST_ID_HEADER = 'X-Request-ID';

// Adds an object to every request that can be used to obtain a reference to the
// logger, view context, request ID, etc.
export default function(app, config: Config) {
  app.use(context.middleware);

  app.use((request, response, next) => {
    const requestId = request.get(REQUEST_ID_HEADER) || uuid();

    context.set('config', config);
    context.set('requestId', requestId);
    next();
  });
}
