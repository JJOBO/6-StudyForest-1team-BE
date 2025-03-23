const express = require("express");
const { getFocusSession } = require("../controllers/focusSessionController");

const router = express.Router();

// 집중 세션 조회 API
router.get("/:id", getFocusSession);

// 포인트 조회 API
router.get("/points/:studyId", getFocusPoints);

module.exports = router;
