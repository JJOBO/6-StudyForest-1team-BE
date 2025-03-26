// src/controllers/studyController.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import express from "express";

const prisma = new PrismaClient();
const studyRouter = express.Router();

// 인증 함수를 별도로 분리
async function confirmPassword(studyId, password) {
  const study = await prisma.study.findUnique({
    where: { id: studyId },
    select: { passwordHash: true },
  });

  if (!study) {
    throw new Error("스터디를 찾을 수 없습니다.");
  }

  const isValid = await bcrypt.compare(password, study.passwordHash);

  if (!isValid) {
    throw new Error("비밀번호가 일치하지 않습니다.");
  }
}

// 스터디 목록 조회, 검색, 정렬, 더보기
studyRouter.get("/study-list", async (req, res) => {
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
      return res.status(400).json({
        message: "유효하지 않은 요청입니다.",
      });
    }
    // 키워드가 포함된 객체를 검색하여 가져오고 없으면 빈배열을 가져옴
    const where = keyword ? { name: { contains: keyword } } : {};

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

    /*  스터디 상세 조회 부분에서 res.setHeader 로 클라이언트 헤더에 recentStudyIds[id] 형식의
    배열값을 보내주고 클라이언트 측에서 recentStudyIds 함수로 최근 스터디 목록을 저장하여 보관
    */

    const recentStudyIds = req.headers.recentstudyids
      ? JSON.parse(req.headers.recentstudyids)
      : [];
    // recentStudyIds 함수에 id값이 있으면 스터디 모델에서 해당 객체를 불러옴
    const recentStudies = await prisma.study.findMany({
      where: {
        id: {
          in: recentStudyIds,
        },
      },
      include: {
        emojis: {
          orderBy: {
            count: "desc",
          },
          take: 3,
        },
      },
    });

    res.json({
      studies,
      total,
      offset: skip,
      recentStudies,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    });
  }
});

// 스터디 생성
studyRouter.post("/study/registration", async (req, res) => {
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
      return res.status(400).json({ message: "유효하지 않은 요청입니다." });
    }
    if (password !== passwordConfirm) {
      return res.status(401).json({
        message: "인증되지 않았습니다. 올바른 인증 정보를 입력해주세요.",
      });
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
    console.error(error);
    res.status(500).json({
      message: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    });
  }
});

// 스터디 상세 조회
studyRouter.get("/study/:study_id", async (req, res) => {
  try {
    const { study_id } = req.params;
    const id = parseInt(study_id);
    // id값 형태 검증
    if (isNaN(id)) {
      return res.status(404).json({
        message: "페이지를 찾을 수 없습니다. URL을 확인해주세요.",
      });
    }

    const study = await prisma.study.findUnique({
      where: { id },
      include: {
        emojis: {
          orderBy: {
            count: "desc",
          },
          take: 3,
        },
        habits: true,
      },
    });
    // id값 유무 검증
    if (!study) {
      return res.status(404).json({
        message: "페이지를 찾을 수 없습니다. URL을 확인해주세요.",
      });
    }

    const recentStudyIds = req.headers.recentstudyids
      ? JSON.parse(req.headers.recentstudyids)
      : [];

    /* 사용자가 입력할 id값과 recentStudyIds에 존재하는 각각의 studyId를 비교하여 중복을 제거한 이후
      updatedRecentStudyIds 배열에 3개의 값만 남김   */

    const updatedRecentStudyIds = [
      id,
      ...recentStudyIds.filter((studyId) => studyId !== id),
    ].slice(0, 3);

    // 리스폰스 헤더값에 recentStudyIds[5] 이런식의 최근 조회 목록 id 배열값을 반환함
    res.setHeader("recentStudyIds", JSON.stringify(updatedRecentStudyIds));

    res.json(study);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    });
  }
});

// 스터디에 이모지 추가
studyRouter.post("/study/:study_id/emoji", async (req, res) => {
  try {
    const { study_id } = req.params;
    const { emoji } = req.body;
    const id = parseInt(study_id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "유효하지 않은 요청입니다." });
    }

    if (!emoji) {
      return res.status(400).json({ message: "유효하지 않은 요청입니다." });
    }

    const study = await prisma.study.findUnique({
      where: { id },
    });

    if (!study) {
      return res
        .status(404)
        .json({ message: "페이지를 찾을 수 없습니다. URL을 확인해주세요." });
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
    console.error(error);
    res.status(500).json({
      message: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    });
  }
});

// 스터디 삭제
studyRouter.delete("/study/:study_id", async (req, res) => {
  try {
    const { study_id } = req.params;
    const { password } = req.body;
    const id = parseInt(study_id);

    if (isNaN(id)) {
      return res.status(404).json({
        message: "페이지를 찾을 수 없습니다. URL을 확인해주세요.",
      });
    }

    try {
      await confirmPassword(id, password);
    } catch (error) {
      return res.status(401).json({
        message: "인증되지 않았습니다. 올바른 인증 정보를 입력해주세요.",
      });
    }

    await prisma.study.delete({ where: { id } });

    res.json({ message: "스터디가 삭제되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    });
  }
});

// 스터디 수정
studyRouter.patch("/study/:study_id", async (req, res) => {
  try {
    const { study_id } = req.params;
    const { password, name, description, background } = req.body;
    const id = parseInt(study_id);

    if (isNaN(id)) {
      return res.status(404).json({
        message: "페이지를 찾을 수 없습니다. URL을 확인해주세요.",
      });
    }
    if (!password) {
      return res.status(400).json({ message: "유효하지 않은 요청입니다." });
    }

    try {
      await confirmPassword(id, password);
    } catch (error) {
      return res.status(401).json({
        message: "인증되지 않았습니다. 올바른 인증 정보를 입력해주세요.",
      });
    }

    const updatedStudy = await prisma.study.update({
      where: { id },
      data: {
        name,
        description,
        background,
      },
    });

    res.json(updatedStudy);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    });
  }
});

export { confirmPassword };
export default studyRouter;
