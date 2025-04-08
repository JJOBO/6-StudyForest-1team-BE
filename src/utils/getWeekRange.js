// 이번 주의 시작, 끝 날짜 구하는 함수
export function getWeekRange() {
  const today = new Date();
  const monday = new Date(today);
  const sunday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  sunday.setDate(monday.getDate() + 6);
  monday.setHours(0, 0, 0, 0);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}
