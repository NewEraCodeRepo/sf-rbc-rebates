import * as express from "express";
import boot from "../../config/boot";
import { Config } from "../config";
import configureMiddleware from "./middleware";
import configureRoutes from "./routes";

export class Server {
  public static start(config: Config = new Config()) {
    const instance = new Server(config);
    instance.build();
    instance.start();
  }

  private app: any;

  constructor(public readonly config: Config = new Config()) {}

  get logger() {
    return this.config.logger;
  }

  get port() {
    return this.config.web.port;
  }

  public build() {
    this.app = express();
    configureMiddleware(this.app, this.config);
    configureRoutes(this.app);
    return this.app;
  }

  public start() {
    this.app.listen(this.port, async () => {
      await boot();
      this.logger.info("Web server started on port", this.port);
    });
  }
}
