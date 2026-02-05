import {
  getAllHypothesis,
  getAllInterviewResponses,
} from "@/services/hypothesis";
import TeamsDashboardTable from "./_components/TeamsDashboardTable";
import { clerkClient } from "@clerk/nextjs/server";
import { getAllParticipants } from "@/services/participants";

export default async function TeamsDashboardPage() {
  const client = await clerkClient();
  const hypothesis = await getAllHypothesis();
  const participants = await getAllParticipants();
  const interviewResponses = await getAllInterviewResponses();
  const organizations = await client.organizations.getOrganizationList();

  const getInterviewsData = (orgId: string) => {
    const scheduleInterviews = participants.filter(
      (p) => p.org_id === orgId && p.scheduled_date
    );

    const conductedInterviews = interviewResponses.filter((ir) => {
      const participant = participants.find((p) => p.id === ir.participant_id);
      return participant?.org_id === orgId;
    });

    return {
      scheduled: scheduleInterviews.length,
      conducted: conductedInterviews.length,
    };
  };

  const getHypothesisData = () => {
    return {
      testing: 1,
      validated: 1,
      invalidated: 0,
    };
  };

  const dashboardData = organizations.data.map((org) => ({
    orgId: org.id,
    orgName: org.name,
    interviews: getInterviewsData(org.id),
    hypothesisStatus: getHypothesisData(),
    hypothesis: hypothesis.filter((h) => h.org_id === org.id).length,
  }));

  console.log("dashboardData", dashboardData);

  return (
    <div className="p-8 h-full bg-white">
      <TeamsDashboardTable data={dashboardData} />
    </div>
  );
}
