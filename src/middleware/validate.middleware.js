// TODO: 안 쓰는 코드 삭제~
const validateStudyCreation = (req, res, next) => {
  const { name, password, passwordConfirm, creatorNick } = req.body;
  if (!name || !password || !passwordConfirm || !creatorNick) {
    return res.status(400).json({ message: "유효하지 않은 요청입니다." });
  }
  if (password !== passwordConfirm) {
    return res.status(401).json({
      message: "비밀번호와 비밀번호 확인이 일치하지 않습니다.",
    });
  }
  next();
};

export default validateStudyCreation;
