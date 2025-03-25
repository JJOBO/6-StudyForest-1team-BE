import express from "express";
import {
  getFocusSessions,
  startFocusSession,
  completeSession,
  pauseFocusSession,
  resumeFocusSession,
} from "./focus.module.js";

const router = express.Router();

// 오늘의 집중 조회
router.get("/studies/:id/password/:password/focus", getFocusSessions);

// 오늘의 집중 시작
router.post("/studies/:id/focus", startFocusSession);

// 오늘의 집중 완료, 일시 정지, 재개 처리
router.put("/studies/:id/focus", async (req, res) => {
  const { action } = req.body;
  const { id } = req.params;

  try {
    switch (action) {
      case "complete":
        return await completeSession(req, res);
      case "pause":
        return await pauseFocusSession(req, res);
      case "resume":
        return await resumeFocusSession(req, res);
      default:
        return res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    res.status(500).json({
      message: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    });
  }
});

export default router;
