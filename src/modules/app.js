import express from "express";
import habitsRouter from "./habits.module.js";

const router = express.Router();

router.use("/study", habitsRouter);

export default router;
