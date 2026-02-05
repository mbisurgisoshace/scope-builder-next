import { getHypothesis, getInterviewResponses } from "@/services/hypothesis";
import HypothesesCard from "./_components/HypothesesCard";
import CreateHypothesisButton from "./_components/CreateHypothesisButton";

export default async function HypothesesPage() {
  const hypotheses = await getHypothesis();
  const interviewResponses = await getInterviewResponses();

  const interviewResponsesData = interviewResponses.map((response) => ({
    id: response.id,
    questionId: response.question_id,
    content: response.response_content,
    interviewee: response.participant.name,
    hypothesysId: response.question.hypothesis_id,
  }));

  const hypothesesData = hypotheses.map((hypothesis) => ({
    id: hypothesis.id,
    type: hypothesis.type,
    title: hypothesis.title,
    priority: hypothesis.priority,
    description: hypothesis.description,
    interviews: interviewResponsesData
      .filter((response) => response.hypothesysId === hypothesis.id)
      .map((response) => response.interviewee),
    questions: hypothesis.questions.map((question) => ({
      id: question.id,
      title: question.title,
      responses: interviewResponsesData
        .filter((response) => response.questionId === question.id)
        .map((response) => response),
    })),
    conclusion_content: hypothesis.conclusion_content,
    conclusion_status: hypothesis.conclusion_status,
  }));

  return (
    <div className="flex flex-col p-4 gap-4 ">
      <CreateHypothesisButton />
      <div className="flex flex-col gap-4">
        {hypothesesData.map((hypothesis) => (
          <HypothesesCard key={hypothesis.id} hypothesis={hypothesis} />
        ))}
      </div>
    </div>
  );
}
