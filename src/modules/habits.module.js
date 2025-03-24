import express from "express";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const habitsRouter = express.Router();

/**
 * 오늘의 습관 생성
 */
habitsRouter.post("/:studyId/create", async (req, res, next) => {
  const { name } = req.body;
  const studyId = Number(req.params.studyId);

  try {
    const newHabit = await prisma.habit.create({
      data: {
        name,
        studyId,
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
habitsRouter.get("/:studyId", async (req, res, next) => {
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
habitsRouter.patch("/:habitId", async (req, res, next) => {
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
habitsRouter.delete("/:habitId", async (req, res, next) => {
  try {
    const habitId = Number(req.params.habitId);

    const habit = await prisma.habit.delete({ where: { id: habitId } });

    res.status(200).json(habit);
  } catch (e) {
    next(e);
  }
});

/**
 * 오늘의 습관 체크
 */
habitsRouter.post("/:habitId/check", async (req, res, next) => {
  const habitId = Number(req.params.habitId);

  try {
    // 오늘 날짜 가져오기 (시간을 00:00:00으로 설정)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingRecord = await prisma.habitRecord.findFirst({
      where: {
        habitId,
        recordDate: today,
      },
    });

    if (!existingRecord) {
      const newRecord = await prisma.habitRecord.create({
        data: {
          habitId,
          recordDate: today,
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
habitsRouter.delete("/:habitId/check", async (req, res, next) => {
  const habitId = Number(req.params.habitId);

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const habitRecord = await prisma.habitRecord.findFirst({
      where: {
        habitId,
        recordDate: today,
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

export default habitsRouter;