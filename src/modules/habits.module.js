import { PrismaClient } from "@prisma/client";
import express from "express";
import { confirmStudyPassword } from "./study.module.js";

const prisma = new PrismaClient();

const habitsRouter = express.Router();

/**
 * 오늘의 습관 비밀번호 인증
 */
habitsRouter.post("/:studyId/habits/auth", async (req, res, next) => {
  const { password } = req.body;
  const studyId = Number(req.params.studyId);

  try {
    await confirmStudyPassword(studyId, password);

    const habit = await prisma.habit.findMany({
      where: { id: studyId },
      select: {
        id: true,
        name: true,
        records: true,
        isActive: true,
      },
    });

    if (!habit) {
      return res.status(400).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    res.json(habit);
  } catch (e) {
    next(e);
  }
});

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
      where: {
        studyId,
        isActive: true,
      },
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

    const hasAnyRecord = await prisma.habitRecord.findFirst({
      where: { habitId },
    });

    if (hasAnyRecord) {
      const updatedHabit = await prisma.habit.update({
        where: { id: habitId },
        data: { isActive: false },
      });

      res.status(200).json(updatedHabit);
    } else {
      await prisma.habitRecord.deleteMany({ where: { habitId } });
      await prisma.habit.delete({ where: { id: habitId } });

      res.status(200).json(updatedHabit);
    }
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

// 이번 주의 시작, 끝 날짜 구하는 함수
function getWeekRange() {
  const today = new Date();
  const monday = new Date(today);
  const sunday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  sunday.setDate(monday.getDate() + 6);
  monday.setHours(0, 0, 0, 0);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

/**
 * 이번 주 습관 기록 조회
 */
habitsRouter.get("/:studyId/habits/week", async (req, res, next) => {
  const studyId = Number(req.params.studyId);

  try {
    const { monday, sunday } = getWeekRange();

    // 해당 스터디의 모든 습관 불러오기
    const habits = await prisma.habit.findMany({
      where: {
        studyId,
      },
    });

    // 이번 주에 체크된 기록 불러오기
    const records = await prisma.habitRecord.findMany({
      where: {
        habitId: {
          in: habits.map((habit) => habit.id),
        },
        recordDate: {
          gte: monday.toISOString().split("T")[0], // "YYYY-MM-DD"
          lte: sunday.toISOString().split("T")[0],
        },
      },
    });

    // 날싸 배열 (월~일)
    const week = [...Array(7)].map((_, i) => {
      const date = new Date(monday);
      date.setDate(date.getDate() + i);
      return date.toISOString().slice(0, 10);
    });

    // 습관별 기록 매핑
    const result = habits.map((habit) => {
      const habitRecords = records
        .filter((record) => record.habitId === habit.id)
        .map((record) =>
          new Date(record.recordDate).toISOString().slice(0, 10)
        );

      const recordsForWeek = week.map((date) => habitRecords.includes(date));

      return {
        habitId: habit.id,
        name: habit.name,
        records: recordsForWeek,
      };
    });

    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
});

export default habitsRouter;
