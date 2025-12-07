import express from "express";
import { connectAlpaca, disconnectAlpaca, getAlpacaStatus, testAlpacaConnection } from "../controllers/alpacaController";

const alpacaRouter = express.Router();

alpacaRouter.get("/status", getAlpacaStatus);
alpacaRouter.post("/connect", connectAlpaca);
alpacaRouter.delete("/connect", disconnectAlpaca);
alpacaRouter.post("/test", testAlpacaConnection);

export default alpacaRouter;
