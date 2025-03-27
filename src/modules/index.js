import express from "express";
import studyRouter from "./study.module.js";
import focusRouter from "./focus.module.js";
import habitsRouter from "./habits.module.js";

const router = express.Router();

router.use("/", studyRouter);
router.use("/study", focusRouter);
router.use("/study", habitsRouter);

export default router;
