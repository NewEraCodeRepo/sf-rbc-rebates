import * as path from "path";
import * as express from "express";

// Serves static resources (CSS, JavaScript, images, etc.)

const STATIC_DIR = path.join(__dirname, "..", "static");

export default function(app: any) {
  app.use(express.static(STATIC_DIR));
}
