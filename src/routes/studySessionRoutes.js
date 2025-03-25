// src/routes/studySessionRoutes.js
import express from "express";
import studyController from "../controllers/studyController.js";

const router = express.Router();

// 스터디 목록 조회, 검색, 정렬, 더보기
router.get("/study-list", studyController.getStudies);

// 스터디 생성
router.post("/study/registration", studyController.createStudy);

// 스터디 상세 조회
router.get("/study/:study_id", studyController.getStudyById);

// 스터디 공유
router.post("/study/:study_id/share", studyController.shareStudy);

// 스터디 삭제
router.delete("/study/:study_id", studyController.deleteStudy);

// 스터디 수정
router.patch("/study/:study_id", studyController.updateStudy);

// 스터디에 이모지 추가
router.post("/study/:study_id/emoji", studyController.addEmoji);

export default router;
