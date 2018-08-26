import * as basicAuth from "express-basic-auth";
import { Config } from "../../config";

export default function(app: any, config: Config) {

  if (config.web.adminAuth) {
    const users = {};
    const credentials = config.web.adminAuth.split(':');
    users[credentials[0]] = credentials[1];

    app.use(basicAuth({ users, challenge: true }));
  }

}
