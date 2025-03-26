import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import router from "./modules/index.js";

// 환경변수 불러오기
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(router);

// 서버 실행
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
