import HypothesesCard from "./_components/HypothesesCard";

export default function HypothesesPage() {
  return (
    <div className="flex flex-col p-4 gap-4">
      <HypothesesCard
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
      />
    </div>
  );
}
