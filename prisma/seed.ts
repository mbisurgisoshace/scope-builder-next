import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // Get Started cards are global curriculum (same for every startup); the
  // per-org "reviewed" state lives in GetStartedReview and is created on toggle.
  // Re-seed cleanly so this script is idempotent.
  await prisma.getStartedCard.deleteMany({});

  // ---- Milestone 1 ----
  await prisma.getStartedCard.create({
    data: {
      milestone: 1,
      type: "text",
      title: "How to talk to Humans",
      order: 0,
      body:
        "A beachhead chart is a strategic tool used to visualize and prioritize " +
        "market opportunities for a product or service. It helps businesses " +
        "identify their initial target market segment, or \"beachhead,\" where " +
        "they can gain traction before expanding further.",
    },
  });

  await prisma.getStartedCard.create({
    data: {
      milestone: 1,
      type: "links",
      title: "Recommended reading",
      order: 1,
      items: {
        create: [
          { title: "Building journey maps in 3 minutes", url: "https://www.nngroup.com/articles/journey-mapping-101/", order: 0 },
          { title: "The 3 steps to building a user journey map", url: "https://www.atlassian.com/agile/product-management/user-journey-maps", order: 1 },
          { title: "Become an expert in CJM", url: "https://www.interaction-design.org/literature/topics/customer-journey-map", order: 2 },
        ],
      },
    },
  });

  await prisma.getStartedCard.create({
    data: {
      milestone: 1,
      type: "videos",
      title: "Watch & learn",
      order: 2,
      items: {
        create: [
          { title: "The 3 steps to building a user journey map", url: "https://www.youtube.com/watch?v=mSxpVRo3BLg", order: 0 },
          { title: "Building journey maps in 3 minutes", url: "https://www.youtube.com/watch?v=W2xLPcmXaSE", order: 1 },
        ],
      },
    },
  });

  // ---- Milestone 2 ----
  await prisma.getStartedCard.create({
    data: {
      milestone: 2,
      type: "text",
      title: "Defining your beachhead",
      order: 0,
      body:
        "By mapping out potential customers, competitors, and key metrics, this " +
        "chart allows teams to focus their efforts on the most promising areas, " +
        "ensuring a more effective and efficient approach to market entry.",
    },
  });

  await prisma.getStartedCard.create({
    data: {
      milestone: 2,
      type: "links",
      title: "Deeper dives",
      order: 1,
      items: {
        create: [
          { title: "Crossing the Chasm — summary", url: "https://en.wikipedia.org/wiki/Crossing_the_Chasm", order: 0 },
          { title: "Beachhead market strategy", url: "https://www.disciplinedentrepreneurship.com/", order: 1 },
        ],
      },
    },
  });

  console.log("Seeded Get Started cards for milestones 1 and 2.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
