import { confirmPassword } from "../modules/study.module";

// TODO: 안 쓰는 코드 삭제해 주세요~
const authentication = async (req, res, next) => {
  const { studyId } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(403).json({ error: "비밀번호를 입력해주세요." });
  }

  try {
    await confirmPassword(studyId, password);
    next();
  } catch (e) {
    next(e);
  }
};

export default authentication;
