import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ✅ 특정 집중 세션 조회 API
export const getFocusSession = async (req, res) => {
  const { id } = req.params;

  try {
    const session = await prisma.focusSession.findUnique({
      where: { id: parseInt(id) },
      include: {
        study: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!session) {
      return res
        .status(404)
        .json({ message: "해당 집중 세션을 찾을 수 없습니다." });
    }

    res.status(200).json(session);
  } catch (error) {
    console.error("집중 세션 조회 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
};
