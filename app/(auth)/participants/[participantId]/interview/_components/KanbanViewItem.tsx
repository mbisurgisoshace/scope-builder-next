import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Hypothesis } from "./KanbanView";
import QuestionResponse from "./QuestionResponse";

interface KanbanViewItemProps {
  participantId: string;
  hypothesis: Hypothesis;
}

export default function KanbanViewItem({
  hypothesis,
  participantId,
}: KanbanViewItemProps) {
  return (
    <Card className="w-[440px]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[#111827]">
          {hypothesis.title}
        </CardTitle>
        <CardDescription>{hypothesis.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {hypothesis.questions.map((question) => (
            <QuestionResponse
              key={question.id}
              question={question}
              participantId={participantId}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
