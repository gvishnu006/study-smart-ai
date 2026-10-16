import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Chapter from "@/models/Chapter";
import Material from "@/models/Material";
import Question from "@/models/Question";
import Quiz from "@/models/Quiz";
import QuizAttempt from "@/models/QuizAttempt";
import StudySession from "@/models/StudySession";
import Exam from "@/models/Exam";
import TimetableEntry from "@/models/TimetableEntry";
import Flashcard from "@/models/Flashcard";
import Goal from "@/models/Goal";

export async function deleteSubjectCascade(userId: string, subjectId: string) {
  await connectDB();
  const sid = new mongoose.Types.ObjectId(subjectId);
  await Promise.all([
    Chapter.deleteMany({ userId, subjectId: sid }),
    Material.deleteMany({ userId, subjectId: sid }),
    Question.deleteMany({ userId, subjectId: sid }),
    Quiz.deleteMany({ userId, subjectId: sid }),
    QuizAttempt.deleteMany({ userId, subjectId: sid }),
    StudySession.updateMany({ userId, subjectId: sid }, { $set: { subjectId: null } }),
    Exam.deleteMany({ userId, subjectId: sid }),
    TimetableEntry.deleteMany({ userId, subjectId: sid }),
    Flashcard.deleteMany({ userId, subjectId: sid }),
    Goal.updateMany({ userId, subjectId: sid }, { $set: { subjectId: null } }),
  ]);
}

export async function cascadeDeleteExam(userId: string, examId: string) {
  await connectDB();
  const eid = new mongoose.Types.ObjectId(examId);
  await TimetableEntry.updateMany(
    { userId, examId: eid },
    { $set: { examId: null } }
  );
}
