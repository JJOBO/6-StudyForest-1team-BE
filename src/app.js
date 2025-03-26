import express from "express";
import cors from "cors";
import studyRouter from "./modules/studyController.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", studyRouter);

export default app;
