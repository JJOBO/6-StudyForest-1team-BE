import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const focusSessionRouter = express.Router();

/**
 * 집중 세션 조회 (단일)
 */
focusSessionRouter.get("/:id", async (req, res, next) => {
  const id = Number(req.params.id);

  try {
    const session = await prisma.focusSession.findUnique({
      where: { id },
      include: { study: true },
    });

    if (!session) {
      return res
        .status(404)
        .json({ message: "해당 세션이 존재하지 않습니다." });
    }

    res.status(200).json(session);
  } catch (e) {
    next(e);
  }
});

/**
 * 포인트 총합 조회
 */
focusSessionRouter.get("/:studyId/points", async (req, res, next) => {
  const studyId = Number(req.params.studyId);

  try {
    const result = await prisma.focusSession.aggregate({
      where: { studyId },
      _sum: { points: true },
    });

    res.status(200).json({
      studyId,
      totalPoints: result._sum.points || 0,
    });
  } catch (e) {
    next(e);
  }
});

/**
 * 체크포인트 생성 (집중 도중 저장)
 */
focusSessionRouter.post("/:id/checkpoints", async (req, res, next) => {
  const sessionId = Number(req.params.id);

  try {
    const checkpoint = await prisma.focusCheckpoint.create({
      data: {
        focusSessionId: sessionId,
        timestamp: new Date(),
      },
    });

    res.status(201).json(checkpoint);
  } catch (e) {
    next(e);
  }
});

/**
 * 체크포인트 조회
 */
focusSessionRouter.get("/:id/checkpoints", async (req, res, next) => {
  const sessionId = Number(req.params.id);

  try {
    const checkpoints = await prisma.focusCheckpoint.findMany({
      where: { focusSessionId: sessionId },
      orderBy: { timestamp: "asc" },
    });

    res.status(200).json(checkpoints);
  } catch (e) {
    next(e);
  }
});

export default focusSessionRouter;
