import express from "express";
import cors from "cors";
import studySessionRoutes from "./routes/studySessionRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", studySessionRoutes);

export default app;
