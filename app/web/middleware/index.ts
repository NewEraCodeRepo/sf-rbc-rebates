import requestContext from "./request_context";
import requestLogging from "./request_logging";
import supportViews from "./views";
import serveStaticResources from "./static";
import parseRequestBody from "./request_body_parsing";
import basicAuth from "./basic-auth";
import { Config } from "../../config";

const middlewareOrder = [
  requestContext,
  requestLogging,
  supportViews,
  serveStaticResources,
  parseRequestBody,
  basicAuth
];

export default function configureMiddleware(app: any, config: Config) {
  middlewareOrder.forEach((middleware) => middleware.call(null, app, config));
}
