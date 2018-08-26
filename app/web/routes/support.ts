import * as context from "express-http-context";
import { Router } from "express";
import { ViewContext } from "../view_context";

const router = Router();

export function viewContext(options: any) {
  const config = context.get('config');
  return new ViewContext(config, options).locals;
}

export function logger() {
  return context.get('config').logger;
}

export function requestId() {
  return context.get('requestId');
}

export const app = router;
