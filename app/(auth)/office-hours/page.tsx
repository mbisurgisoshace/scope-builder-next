import { checkRole } from "@/lib/auth";
import { getOfficeHourSlots } from "@/services/officeHours";
import AvailabilityEditor from "./_components/AvailabilityEditor";

export default async function OfficeHoursPage() {
  const isAdmin = await checkRole("admin");
  const slots = await getOfficeHourSlots();

  if (!isAdmin) {
    return (
      <div className="p-8 h-full flex items-center justify-center">
        <p className="text-gray-500 text-sm">
          Office Hours sign-up view coming soon.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 h-full">
      <div className="border-2 rounded-2xl bg-white p-8 h-full overflow-hidden flex flex-col">
        <AvailabilityEditor initialSlots={slots} />
      </div>
    </div>
  );
}
