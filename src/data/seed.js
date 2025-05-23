import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { mockStudyData } from "./mockStudyData.js";
import { mockHabitData } from "./mockHabitData.js";
import { mockHabitRecordData } from "./mockHabitRecordData.js";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.emoji.deleteMany(),
    prisma.habitRecord.deleteMany(),
    prisma.habit.deleteMany(),
    prisma.study.deleteMany(),
  ]);

  await prisma.$executeRaw`ALTER SEQUENCE "Emoji_id_seq" RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE "HabitRecord_id_seq" RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE "Habit_id_seq" RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE "Study_id_seq" RESTART WITH 1`;

  for (const study of mockStudyData.studies) {
    const { emojis, ...studyData } = study;
    await prisma.study.create({
      data: {
        ...studyData,
        ...(emojis.length > 0 && {
          emojis: {
            create: emojis,
          },
        }),
      },
    });
  }

  await prisma.habit.createMany({
    data: mockHabitData,
  });

  await prisma.habitRecord.createMany({
    data: mockHabitRecordData,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
