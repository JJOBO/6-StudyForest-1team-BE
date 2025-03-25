import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const habitsRouter = express.Router();

/**
 * 오늘의 습관 생성
 */
habitsRouter.post("/:studyId/habits", async (req, res, next) => {
  const { name } = req.body;
  const studyId = Number(req.params.studyId);

  try {
    const newHabit = await prisma.habit.create({
      data: {
        name,
        studyId,
        isActive: true,
      },
    });

    res.status(201).json(newHabit);
  } catch (e) {
    next(e);
  }
});

/**
 * 오늘의 습관 조회
 */
habitsRouter.get("/:studyId/habits", async (req, res, next) => {
  const studyId = Number(req.params.studyId);

  try {
    const habits = await prisma.habit.findMany({
      where: { studyId },
    });

    res.status(200).json(habits);
  } catch (e) {
    next(e);
  }
});

/**
 * 오늘의 습관 수정
 */
habitsRouter.patch("/habits/:habitId", async (req, res, next) => {
  try {
    const habitId = Number(req.params.habitId);
    const { name } = req.body;

    const habit = await prisma.habit.update({
      where: { id: habitId },
      data: { name },
    });

    res.status(200).json(habit);
  } catch (e) {
    next(e);
  }
});

/**
 * 오늘의 습관 삭제
 */
habitsRouter.delete("/habits/:habitId", async (req, res, next) => {
  try {
    const habitId = Number(req.params.habitId);

    const updatedHabit = await prisma.habit.update({
      where: { id: habitId },
      data: { isActive: false },
    });

    res.status(200).json(updatedHabit);
  } catch (e) {
    next(e);
  }
});

/**
 * 오늘의 습관 체크
 */
habitsRouter.post("/habits/:habitId/check", async (req, res, next) => {
  try {
    const habitId = Number(req.params.habitId);

    const today = new Date();
    const todayString = today.toISOString().split("T")[0]; // "YYYY-MM-DD" 형식으로 변환

    const existingRecord = await prisma.habitRecord.findFirst({
      where: {
        habitId,
        recordDate: todayString,
      },
    });

    if (!existingRecord) {
      const newRecord = await prisma.habitRecord.create({
        data: {
          habitId,
          recordDate: todayString,
        },
      });

      res.status(201).json(newRecord);
    } else {
      res.status(400).json({ message: "이미 체크된 습관입니다." });
    }
  } catch (e) {
    next(e);
  }
});

/**
 * 오늘의 습관 해제
 */
habitsRouter.delete("/habits/:habitId/uncheck", async (req, res, next) => {
  try {
    const habitId = Number(req.params.habitId);

    const today = new Date();
    const todayString = today.toISOString().split("T")[0];

    const habitRecord = await prisma.habitRecord.findFirst({
      where: {
        habitId,
        recordDate: todayString,
      },
    });

    if (!habitRecord) {
      return res.status(404).json({ message: "체크된 습관이 아닙니다." });
    }

    await prisma.habitRecord.delete({
      where: { id: habitRecord.id },
    });

    res.status(200).json({ message: "오늘의 습관이 해제되었습니다." });
  } catch (e) {
    next(e);
  }
});

// 이번 주 월요일 구하는 함수
function getStartOfWeek(date) {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
  startOfWeek.setDate(startOfWeek.getDate() - day);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek.toISOString().split("T")[0];
}

// 이번 주 일요일 구하는 함수
function getEndOfWeek(date) {
  const endOfWeek = new Date(date);
  const day = endOfWeek.getDay();
  endOfWeek.setDate(endOfWeek.getDate() + (6 - day));
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek.toISOString().split("T")[0];
}

/**
 * 이번 주 습관 기록 조회
 */
habitsRouter.get("/:studyId/habits/week", async (req, res, next) => {
  const studyId = Number(req.params.studyId);

  try {
    const today = new Date();
    const startOfWeek = getStartOfWeek(today); // 월요일 날짜
    const endOfWeek = getEndOfWeek(today); // 일요일 날짜

    const records = await prisma.habitRecord.findMany({
      where: {
        habit: {
          studyId,
          isActive: true,
        },
        recordDate: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
    });

    res.status(200).json(records);
  } catch (e) {
    next(e);
  }
});

export default habitsRouter;
