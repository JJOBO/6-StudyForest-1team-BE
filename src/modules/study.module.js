import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import express from "express";

const prisma = new PrismaClient();
const studyRouter = express.Router();

// 인증 함수를 별도로 분리
async function confirmStudyPassword(studyId, password) {
  const study = await prisma.study.findUnique({
    where: { id: studyId },
    select: { passwordHash: true },
  });

  if (!study) {
    const error = new Error("스터디를 찾을 수 없습니다.");
    error.statusCode = 404;
    throw error;
  }

  const isValid = await bcrypt.compare(password, study.passwordHash);

  if (!isValid) {
    const error = new Error("비밀번호가 일치하지 않습니다.");
    error.statusCode = 401;
    throw error;
  }
}

// 스터디 비밀번호
studyRouter.post("/study/:studyId/auth", async (req, res, next) => {
  try {
    const { studyId } = req.params;
    const { password } = req.body;
    const id = parseInt(studyId);

    if (isNaN(id) || !password) {
      const error = new Error("유효하지 않은 요청입니다.");
      error.statusCode = 400;
      throw error;
    }

    await confirmStudyPassword(id, password); // ✅ 인증만

    res.json({ success: true }); // 인증 성공만 응답
  } catch (error) {
    error.statusCode = error.statusCode || 401;
    next(error);
  }
});

// 스터디 목록 조회, 검색, 정렬, 더보기
studyRouter.get("/study-list", async (req, res, next) => {
  try {
    const { keyword, order = "createdAt", offset = 0 } = req.query;
    const take = 6; // 6개 목록씩 가져옴
    const skip = parseInt(offset);

    const orderBy = {};
    if (order === "createdAt") {
      orderBy.createdAt = "desc";
    } else if (order === "oldest") {
      orderBy.createdAt = "asc";
    } else if (order === "totalPointsDesc") {
      orderBy.totalPoints = "desc";
    } else if (order === "totalPointsAsc") {
      orderBy.totalPoints = "asc";
    } else {
      const error = new Error("유효하지 않은 정렬 기준입니다.");
      error.statusCode = 400;
      throw error;
    }
    // 키워드가 포함된 객체를 검색하여 가져오고 없으면 빈배열을 가져옴
    const where = keyword
      ? {
          OR: [
            { name: { contains: keyword } },
            { description: { contains: keyword } },
            { creatorNick: { contains: keyword } },
          ],
        }
      : {};

    // 스터디모델에서 정보 가져와서 변수에 할당, 이모지는 추천 많은순으로 3개 가져옴
    const studies = await prisma.study.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        emojis: {
          orderBy: {
            count: "desc",
          },
          take: 3,
        },
      },
    });

    // where 조건에 포함된 객체의 총 개수를 변수에 할당
    const total = await prisma.study.count({ where });

    res.json({
      studies,
      total,
      offset: skip,
    });
  } catch (error) {
    next(error);
  }
});

// 스터디 생성
studyRouter.post("/study/registration", async (req, res, next) => {
  try {
    const {
      name,
      description,
      background,
      password,
      passwordConfirm,
      creatorNick,
    } = req.body;

    if (!name || !password || !passwordConfirm || !creatorNick) {
      const error = new Error("필수 입력값이 누락되었습니다.");
      error.statusCode = 400;
      throw error;
    }
    if (password !== passwordConfirm) {
      const error = new Error("비밀번호가 일치하지 않습니다.");
      error.statusCode = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const study = await prisma.study.create({
      data: {
        name,
        description,
        background,
        passwordHash: hashedPassword,
        creatorNick,
      },
    });

    res.status(201).json(study);
  } catch (error) {
    next(error);
  }
});

// 스터디 상세 조회
studyRouter.get("/study/:studyId", async (req, res, next) => {
  try {
    const { studyId } = req.params;
    const id = parseInt(studyId);
    // id값 형태 검증
    if (isNaN(id)) {
      const error = new Error("페이지를 찾을 수 없습니다. URL을 확인해주세요.");
      error.statusCode = 404;
      throw error;
    }

    const study = await prisma.study.findUnique({
      where: { id },
      include: {
        emojis: {
          orderBy: {
            count: "desc",
          },
        },
        habits: true,
      },
    });
    // id값 유무 검증
    if (!study) {
      const error = new Error("페이지를 찾을 수 없습니다. URL을 확인해주세요.");
      error.statusCode = 404;
      throw error;
    }

    res.json(study);
  } catch (error) {
    next(error);
  }
});

// 스터디에 이모지 추가
studyRouter.post("/study/:studyId/emoji", async (req, res, next) => {
  try {
    const { studyId } = req.params;
    const { emoji } = req.body;
    const id = parseInt(studyId);

    if (isNaN(id)) {
      const error = new Error("유효하지 않은 요청입니다.");
      error.statusCode = 400;
      throw error;
    }

    if (!emoji) {
      const error = new Error("유효하지 않은 요청입니다.");
      error.statusCode = 400;
      throw error;
    }

    const study = await prisma.study.findUnique({
      where: { id },
    });

    if (!study) {
      const error = new Error("페이지를 찾을 수 없습니다. URL을 확인해주세요.");
      error.statusCode = 404;
      throw error;
    }

    const existingEmoji = await prisma.emoji.findFirst({
      where: {
        studyId: id,
        emoji: emoji,
      },
    });

    // id값과 emoji(string)로 이모지가 있는지 확인하고 있으면 카운트를 1늘리고 없으면 새로 생성
    if (existingEmoji) {
      await prisma.emoji.update({
        where: { id: existingEmoji.id },
        data: { count: { increment: 1 } },
      });
    } else {
      await prisma.emoji.create({
        data: {
          studyId: id,
          emoji: emoji,
          count: 1,
        },
      });
    }

    res.status(200).json({ message: "이모지가 성공적으로 추가되었습니다." });
  } catch (error) {
    next(error);
  }
});

// 스터디 삭제
studyRouter.delete("/study/:studyId", async (req, res, next) => {
  try {
    const { studyId } = req.params;
    const { password } = req.body;
    const id = parseInt(studyId);

    if (isNaN(id)) {
      const error = new Error("페이지를 찾을 수 없습니다. URL을 확인해주세요.");
      error.statusCode = 404;
      throw error;
    }

    try {
      await confirmStudyPassword(id, password);
    } catch (error) {
      const errorCode = new Error(
        "인증되지 않았습니다. 올바른 인증 정보를 입력해주세요."
      );
      errorCode.statusCode = 404;
      throw errorCode;
    }

    // HabitRecord 삭제
    await prisma.habitRecord.deleteMany({
      where: {
        habit: {
          studyId: id,
        },
      },
    });

    // Habit 삭제
    await prisma.habit.deleteMany({
      where: {
        studyId: id,
      },
    });

    // Emoji 삭제
    await prisma.emoji.deleteMany({
      where: { studyId: id },
    });

    await prisma.study.delete({ where: { id } });

    res.json({ message: "스터디가 삭제되었습니다." });
  } catch (error) {
    next(error);
  }
});

// 스터디 수정
studyRouter.patch("/study/:studyId", async (req, res, next) => {
  try {
    const { studyId } = req.params;
    const { password, name, description, background, creatorNick } = req.body;
    const id = parseInt(studyId);

    if (isNaN(id)) {
      const error = new Error("페이지를 찾을 수 없습니다. URL을 확인해주세요.");
      error.statusCode = 404;
      throw error;
    }
    if (!password) {
      const error = new Error("유효하지 않은 요청입니다.");
      error.statusCode = 400;
      throw error;
    }

    try {
      await confirmStudyPassword(id, password);
    } catch (error) {
      const errorCode = new Error(
        "인증되지 않았습니다. 올바른 인증 정보를 입력해주세요."
      );
      error.statusCode = 401;
      throw errorCode;
    }

    const updatedStudy = await prisma.study.update({
      where: { id },
      data: {
        name,
        description,
        background,
        creatorNick,
      },
    });

    res.json(updatedStudy);
  } catch (error) {
    next(error);
  }
});
