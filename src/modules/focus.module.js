import express from "express";
import { PrismaClient } from "@prisma/client";
import { confirmStudyPassword } from "./study.module.js";

const prisma = new PrismaClient();
const focusRouter = express.Router();

// 비밀번호 인증 API
focusRouter.post("/:studyId/focus/auth", async (req, res, next) => {
  const studyId = Number(req.params.studyId);
  const { password } = req.body;

  try {
    // 함수로 비밀번호 확인
    await confirmStudyPassword(studyId, password);

    // 비밀번호 인증 성공 → 집중 정보 반환
    const study = await prisma.study.findMany({
      where: { id: studyId },
      select: {
        id: true,
        focusStartTime: true,
        focusTargetTime: true,
        totalPoints: true,
      },
    });

    if (!study) {
      const error = new Error("스터디가 존재하지 않습니다.");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json(study);
  } catch (e) {
    next(e);
  }
});

/**
 * 포인트 계산 함수
 */
function calculateFocusPoints(diffInSeconds) {
  if (diffInSeconds > 0) return 0;

  const diffInMinutes = Math.floor(Math.abs(diffInSeconds) / 60);
  if (diffInMinutes < 10) return 3;

  return 3 + Math.floor(diffInMinutes / 10); // 10분당 1점 추가
}

/**
 * 오늘의 집중 시작
 */
focusRouter.post("/:studyId/focus", async (req, res, next) => {
  try {
    const { studyId } = req.params;
    const { targetTime } = req.body;

    if (!targetTime || targetTime <= 0) {
      const error = new Error("올바르지 않은 집중 시간입니다.");
      error.statusCode = 403;
      throw error;
    }

    await prisma.study.update({
      where: { id: Number(studyId) },
      data: {
        focusStartTime: new Date(),
        focusTargetTime: targetTime,
      },
    });

    res.status(201).json({ message: "집중이 시작되었습니다." });
  } catch (error) {
    next(error);
  }
});

/**
 * 오늘의 집중 종료
 */
focusRouter.put("/:studyId/focus", async (req, res, next) => {
  try {
    const { studyId } = req.params;
    const { elapsedTime } = req.body;

    const focusStudy = await prisma.study.findUnique({
      where: { id: Number(studyId) },
    });

    if (
      !focusStudy ||
      !focusStudy.focusStartTime ||
      focusStudy.focusTargetTime === null
    ) {
      const error = new Error("요청한 작업을 수행하기 위한 권한이 없습니다.");
      error.statusCode = 403;
      throw error;
    }

    const { focusTargetTime, totalPoints } = focusStudy;
    const timeDifference = focusTargetTime - elapsedTime; // 초 단위

    const focusPoints = calculateFocusPoints(timeDifference);

    const updatedStudy = await prisma.study.update({
      where: { id: parseInt(studyId) },
      data: {
        totalPoints: totalPoints + focusPoints,
        focusStartTime: null,
        focusTargetTime: null,
      },
    });

    res
      .status(200)
      .json({ focusPoints, totalPoints: updatedStudy.totalPoints });
  } catch (error) {
    next(error);
  }
});

export default focusRouter;
