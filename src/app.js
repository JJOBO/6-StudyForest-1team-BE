import express from "express";
import cors from "cors";
import studyRoutes from "./routes/studyRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/studies", studyRoutes);

export default app;
