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
        {/* <HypothesesCard
          hypotheses={{
            id: "1",
            priority: 0,
            description: "Test",
            title:
              "Users don’t read articles entirely and this leads to bad quiz results",
            conclusion_status: "testing",
            questions: [],
            interviews: [],
          }}
        />

        <HypothesesCard
          hypotheses={{
            id: "1",
            priority: 1,
            description: "Test",
            title:
              "Users don’t read articles entirely and this leads to bad quiz results",
            conclusion_status: "validated",
            questions: [
              {
                id: "q1",
                title:
                  "When you read an article before taking a quiz, how do you usually read it?",
                responses: [
                  {
                    id: "a1",
                    content: "From beginning to end carefully",
                    interviewee: "Mike Smith",
                  },
                  {
                    id: "a2",
                    content: "Skimming through",
                    interviewee: "Kristian Brown",
                  },
                ],
              },
              {
                id: "q2",
                title:
                  "At what point do you typically stop reading an article (if you don’t finish it)?",
                responses: [],
              },
              {
                id: "q3",
                title:
                  "What usually causes you to stop reading an article before the end?",
                responses: [],
              },
            ],
            interviews: [
              "Mike Smith",
              "Kristian Brown",
              "Linda Moore",
              "John Adams",
            ],
          }}
        />

        <HypothesesCard
          hypotheses={{
            id: "1",
            priority: 3,
            description: "Test",
            title:
              "Users don’t read articles entirely and this leads to bad quiz results",
            conclusion_status: "invalidated",
            questions: [
              {
                id: "q1",
                title:
                  "When you read an article before taking a quiz, how do you usually read it?",
                responses: [],
              },
              {
                id: "q2",
                title:
                  "At what point do you typically stop reading an article (if you don’t finish it)?",
                responses: [],
              },
              {
                id: "q3",
                title:
                  "What usually causes you to stop reading an article before the end?",
                responses: [],
              },
            ],
            interviews: [
              "Mike Smith",
              "Kristian Brown",
              "Linda Moore",
              "John Adams",
            ],
            conclusion_content:
              "The assumption was valid. Users don’t even focus on reading and usually try to go through quiz and guess answers/rely on existing knowledge.",
          }}
        /> */}
      </div>
    </div>
  );
}
