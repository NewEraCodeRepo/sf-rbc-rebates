import * as bodyParser from "body-parser";

// Allows a route to call request.body to receive a plain object constructed
// from the parameters sent in the request.

export default function(app: any) {
  app.use(bodyParser.urlencoded({ extended: true }));
}
