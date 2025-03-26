// server.js (통합형)

import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// 라우트 불러오기
import focusSessionRouter from "./modules/focusSession.module.js";
import focusRouter from "./modules/focus.module.js";
import studyRouter from "./modules/study.module.js";

// 환경변수 불러오기
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// API 라우팅
app.use("/api/focus-sessions", focusSessionRouter);
app.use("/api/study", focusRouter);
app.use("/api/study", studyRouter);

// 서버 실행
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
