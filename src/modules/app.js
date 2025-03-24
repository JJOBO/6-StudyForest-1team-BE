import express from "express";
import habitsRouter from "./habits.module.js";

const router = express.Router();

router.use("/habits", habitsRouter);

export default router;
