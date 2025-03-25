import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 오늘의 집중 조회
export const getFocusSessions = async (req, res) => {
  const { id, password } = req.params;

  try {
    const study = await prisma.study.findUnique({
      where: { id: parseInt(id) },
    });

    if (!study || study.passwordHash !== password) {
      return res
        .status(403)
        .json({ error: "요청한 작업을 수행하기 위한 권한이 없습니다." });
    }

    const focusSession = await prisma.focusSession.findUnique({
      where: { studyId: parseInt(id) },
    });

    if (!focusSession) {
      return res
        .status(404)
        .json({ error: "해당 집중 세션을 찾을 수 없습니다." });
    }

    res.status(200).json(focusSession);
  } catch (error) {
    console.error("오늘의 집중을 조회할 수 없습니다.", error);
    res.status(500).json({
      error: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    });
  }
};

// 오늘의 집중 시작
export const startFocusSession = async (req, res) => {
  const { id } = req.params;
  const { focusTime } = req.body;

  if (!focusTime) {
    return res
      .status(400)
      .json({ error: "집중 시간(focusTime)이 필요합니다." });
  }

  try {
    const session = await prisma.focusSession.findUnique({
      where: { studyId: parseInt(id) },
    });

    await prisma.focusSession.update({
      where: { id: session.id },
      data: {
        startTime: new Date(),
        endTime: null,
        focusTime: parseInt(focusTime),
        pausedTime: null,
      },
    });

    res.status(201).json({ message: "집중 세션이 시작되었습니다." });
  } catch (error) {
    console.error("집중 세션 시작 오류:", error);
    res.status(500).json({
      error: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    });
  }
};

// 오늘의 집중 완료
export const completeSession = async (req, res) => {
  const { id } = req.params;

  try {
    const session = await prisma.focusSession.findUnique({
      where: { studyId: parseInt(id) },
    });

    if (!session) {
      return res
        .status(404)
        .json({ error: "해당 집중 세션을 찾을 수 없습니다." });
    }

    const endTime = new Date();
    let totalPausedTime = 0;

    if (session.pausedTime) {
      const pausedDuration = (endTime - new Date(session.pausedTime)) / 1000;
      totalPausedTime += pausedDuration;
    }

    const totalDurationInMilliseconds =
      endTime - session.startTime - totalPausedTime * 1000;

    // 총 집중 시간
    const totalFocusTimeInSeconds = Math.floor(
      totalDurationInMilliseconds / 1000
    );

    const durationInMinutes = Math.floor(totalFocusTimeInSeconds / 60);
    const durationInSeconds = totalFocusTimeInSeconds % 60;

    let pointsEarned = 0;

    // 원래 설정한 집중 시간과 비교하여 점수 계산
    if (totalFocusTimeInSeconds >= session.focusTime * 60) {
      pointsEarned = 3;
      const additionalSeconds =
        totalFocusTimeInSeconds - session.focusTime * 60;

      if (additionalSeconds > 0) {
        pointsEarned += Math.floor(additionalSeconds / 600); // 10분마다 추가 점수
      }
    }

    const totalPoints = session.totalPoints + pointsEarned;

    await prisma.focusSession.update({
      where: { id: session.id },
      data: {
        endTime: endTime,
        totalPoints: totalPoints,
      },
    });

    res.json({
      totalPoints: totalPoints,
      focusTime: `${durationInMinutes}분 ${durationInSeconds}초`,
    });
  } catch (error) {
    console.error("집중 세션 완료 오류:", error);
    res.status(500).json({
      error: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    });
  }
};

// 오늘의 집중 일시 정지
export const pauseFocusSession = async (req, res) => {
  const { id } = req.params;

  try {
    const session = await prisma.focusSession.findUnique({
      where: { studyId: parseInt(id) },
    });

    if (!session) {
      return res
        .status(404)
        .json({ error: "해당 집중 세션을 찾을 수 없습니다." });
    }

    await prisma.focusSession.update({
      where: { id: session.id },
      data: {
        pausedTime: new Date(),
      },
    });

    res.json({ message: "일시 정지" });
  } catch (error) {
    console.error("일시 정지 오류:", error);
    res.status(500).json({
      error: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    });
  }
};

// 오늘의 집중 재개
export const resumeFocusSession = async (req, res) => {
  const { id } = req.params;

  try {
    const session = await prisma.focusSession.findUnique({
      where: { studyId: parseInt(id) },
    });

    if (!session) {
      return res
        .status(404)
        .json({ error: "해당 집중 세션을 찾을 수 없습니다." });
    }

    await prisma.focusSession.update({
      where: { id: session.id },
      data: {
        pausedTime: null,
      },
    });

    res.json({ message: "재개" });
  } catch (error) {
    console.error("재개 오류:", error);
    res.status(500).json({
      error: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    });
  }
};

export default {
  getFocusSessions,
  startFocusSession,
  completeSession,
  pauseFocusSession,
  resumeFocusSession,
};
