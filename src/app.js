import express from "express";
import cors from "cors";
import studyRoutes from "./routes/studyRoutes.js";
import focusSessionRoutes from "./routes/focusSessionRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/studies", studyRoutes);
// FocusSession 관련 API 추가
app.use("/api/focus-sessions", focusSessionRoutes);

export default app;
