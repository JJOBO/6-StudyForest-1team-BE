import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const studyController = {
  // 스터디 목록 조회, 검색, 정렬, 더보기
  getStudies: async (req, res) => {
    try {
      const { keyword, order = "createdAt", offset = 0 } = req.query;
      const take = 6;
      const skip = parseInt(offset);

      const orderBy = {};
      if (order === "createdAt") {
        orderBy.createdAt = "desc";
      } else if (order === "oldest") {
        orderBy.createdAt = "asc";
      } else if (order === "pointsDesc") {
        orderBy.points = "desc";
      } else if (order === "pointsAsc") {
        orderBy.points = "asc";
      } else {
        return res.status(400).json({
          message: "유효하지 않은 요청입니다.",
        });
      }

      const where = keyword ? { name: { contains: keyword } } : {};
      // 스터디모델에서 정보 가져오고 이모지는 추천 많은순으로 3개 조회
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

      const total = await prisma.study.count({ where });

      const recentStudyIds = req.headers.recentstudyids
        ? JSON.parse(req.headers.recentstudyids)
        : [];

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
  },

  // 스터디 생성
  createStudy: async (req, res) => {
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
  },

  // 스터디 상세 조회
  getStudyById: async (req, res) => {
    try {
      const { study_id } = req.params;
      const id = parseInt(study_id);

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

      if (!study) {
        return res.status(404).json({
          message: "페이지를 찾을 수 없습니다. URL을 확인해주세요.",
        });
      }

      const recentStudyIds = req.headers.recentstudyids
        ? JSON.parse(req.headers.recentstudyids)
        : [];
      const updatedRecentStudyIds = [
        id,
        ...recentStudyIds.filter((studyId) => studyId !== id),
      ].slice(0, 3);

      res.setHeader("recentStudyIds", JSON.stringify(updatedRecentStudyIds));

      res.json(study);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
      });
    }
  },

  // 스터디에 이모지 추가
  addEmoji: async (req, res) => {
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
  },

  // 스터디 삭제
  deleteStudy: async (req, res) => {
    try {
      const { study_id } = req.params;
      const { password } = req.body;
      const id = parseInt(study_id);

      if (isNaN(id)) {
        return res.status(404).json({
          message: "페이지를 찾을 수 없습니다. URL을 확인해주세요.",
        });
      }

      const study = await prisma.study.findUnique({
        where: { id },
      });

      if (!study) {
        return res.status(404).json({
          message: "페이지를 찾을 수 없습니다. URL을 확인해주세요.",
        });
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        study.passwordHash
      );

      if (!isPasswordValid) {
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
  },

  // 스터디 수정
  updateStudy: async (req, res) => {
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

      const study = await prisma.study.findUnique({
        where: { id },
      });

      if (!study) {
        return res.status(404).json({
          message: "페이지를 찾을 수 없습니다. URL을 확인해주세요.",
        });
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        study.passwordHash
      );

      if (!isPasswordValid) {
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
  },

  // 스터디 공유
  shareStudy: async (req, res) => {},
};

export default studyController;
