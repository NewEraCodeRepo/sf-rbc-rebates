import * as layouts from "express-ejs-layouts";
import * as path from "path";

export default function(app: any) {
  // Support EJS templates in app/web/views directory
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "..", "views"));

  // Support view layouts
  app.use(layouts);
}
