// 임시 스터디 생성코드(삭제 예정)

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 임시 스터디 생성
  const study = await prisma.study.create({
    data: {
      name: "임시작성자의 개발공장",
      passwordHash: "hashed_password",
      creatorNick: "임시작성자",
    },
  });

  // 임시 집중 세션 생성
  const focusSession = await prisma.focusSession.create({
    data: {
      study: {
        connect: { id: study.id }, // 생성한 스터디와 연결
      },
      startTime: new Date(),
      focusTime: 5,
    },
  });

  console.log("임시 데이터가 생성되었습니다.");
  console.log("생성된 스터디:", study);
  console.log("생성된 집중 세션:", focusSession);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
