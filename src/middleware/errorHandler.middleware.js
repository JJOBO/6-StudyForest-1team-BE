const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "서버에 문제가 발생했습니다.";
  console.error(`[Error] ${message}`); // 에러 로그 출력
  console.log("hello");
  res.status(statusCode).json({ error: message });
};

export default errorHandler;
