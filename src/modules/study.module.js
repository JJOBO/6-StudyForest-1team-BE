// 임시 생성 코드(삭제 예정)
import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const studyRouter = express.Router();

async function confirmStudyPassword(studyId, password) {
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
studyRouter.post("/", async (req, res, next) => {
  try {
    const { name, description, background, creatorNick, password } = req.body;

    if (!name || !creatorNick || !password) {
      return res.status(400).json({ error: "필수 정보가 누락되었습니다." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newStudy = await prisma.study.create({
      data: {
        name,
        description,
        background,
        creatorNick,
        passwordHash,
      },
    });

    res.status(201).json(newStudy);
  } catch (e) {
    next(e);
  }
});

export { confirmStudyPassword };
export default studyRouter;
