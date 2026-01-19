import TeamsDashboardTable from "./_components/TeamsDashboardTable";

export default async function TeamsDashboardPage() {
  return (
    <div className="p-8 h-full bg-white">
      <TeamsDashboardTable data={[]} />
    </div>
  );
}
