import { PrismaClient } from "@prisma/client";
import express from "express";
import { confirmStudyPassword } from "./study.module.js";
import { getWeekRange } from "../utils/getWeekRange.js";

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
      return res.status(400).json({ message: "존재하지않는 습관입니다" });
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
      const deletedHabit = await prisma.habit.delete({
        where: { id: habitId },
      });

      res.status(200).json(deletedHabit);
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

/**
 * 통합 데이터 조회: 습관기록, 이번주 기록, 스터디정보
 */
habitsRouter.get("/:studyId/habits/dashboard", async (req, res, next) => {
  const studyId = Number(req.params.studyId);

  try {
    // 스터디 정보 조회
    const studyInfo = await prisma.study.findUnique({
      where: { id: studyId },
      select: {
        id: true,
        name: true,
        creatorNick: true,
      },
    });

    if (!studyInfo) {
      return res.status(404).json({ message: "존재하지 않는 스터디입니다" });
    }

    // 습관 목록 조회
    const habits = await prisma.habit.findMany({
      where: { studyId, isActive: true },
    });

    // 이번 주 습관 기록 조회
    const { monday, sunday } = getWeekRange();

    const records = await prisma.habitRecord.findMany({
      where: {
        habitId: {
          in: habits.map((habit) => habit.id),
        },
        recordDate: {
          gte: monday.toISOString().split("T")[0],
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
    const habitRecord = habits.map((habit) => {
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

    // 통합 데이터 응답
    res.status(200).json({
      studyInfo: {
        id: studyInfo.id,
        name: studyInfo.name,
        creatorNick: studyInfo.creatorNick,
      },
      habits: habits,
      weeklyRecords: habitRecord,
    });
  } catch (e) {
    next(e);
  }
});

export default habitsRouter;
