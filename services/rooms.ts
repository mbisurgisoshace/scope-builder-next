import { v4 as uuidv4 } from "uuid";
import liveblocks from "@/lib/liveblocks";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { LiveList, LiveObject } from "@liveblocks/client";
import { Shape } from "@/components/CanvasModule/types";

export async function getRoomData(roomId: string) {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const storage = await liveblocks.getStorageDocument(roomId);

  return storage;
}

export async function initializeInterviewRoom(roomId: string) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  await liveblocks.getOrCreateRoom(roomId, {
    defaultAccesses: [],
  });

  const roomStorage = await liveblocks.getStorageDocument(roomId);
  const questionStorage: any = await liveblocks.getStorageDocument(
    `questions-${orgId}`
  );

  if (Object.keys(roomStorage.data).length > 0) return;

  const questionStorageShapes = questionStorage.data.shapes?.data || [];
  const initialInterviewStorageShapes = questionStorageShapes.map(
    (shape: any) => {
      return {
        liveblocksType: "LiveObject",
        data: {
          ...shape.data,
          id: uuidv4(),
          draftRaw: null,
          metadata: {
            questionId: shape.data.id,
            questionDate: new Date().toDateString(),
          },
        },
      };
    }
  );

  await liveblocks.initializeStorageDocument(roomId, {
    liveblocksType: "LiveObject",
    data: {
      shapes: {
        liveblocksType: "LiveList",
        data: initialInterviewStorageShapes,
      },
      comments: {
        liveblocksType: "LiveList",
        data: [],
      },
      connections: {
        liveblocksType: "LiveList",
        data: [],
      },
    },
  });
}

export async function initializeExampleCards(
  roomId: string,
  createExamples: () => LiveList<LiveObject<any>>
) {
  const roomStorage = await liveblocks.getStorageDocument(roomId);
  console.log("Room storage data", roomStorage.data);

  //@ts-ignore
  const hasExample = hasExampleCards(roomStorage.data.shapes.data as any[]);

  if (!hasExample) {
    const exampleCards = await createExamples();
    console.log("Initializing example cards", exampleCards);

    await liveblocks.mutateStorage(roomId, ({ root }) => {
      const shapes = root.get("shapes");
      exampleCards.forEach((card) => {
        shapes.push(
          new LiveObject({
            ...card.toObject(),
          })
        );
      });
    });
  }
}

export function hasExampleCards(shapes: any[]) {
  return shapes.some(
    (shape) =>
      shape.data.subtype?.includes("example") ||
      shape.data.type?.includes("example")
  );
}

export function createSegmentExampleCards() {
  const shapes: LiveList<LiveObject<any>> = new LiveList([]);
  shapes.push(
    new LiveObject({
      id: uuidv4(),
      type: "card",
      x: 100,
      y: 100,
      color: "#EAFBE3",
      width: 440,
      height: 325,
      subtype: "example_customer_card",
      cardTitle:
        "Pickup eg: Drivers of luxury light duty pickup trucks configured to tow recreational trailers",
      draftRaw:
        '{"blocks":[{"key":"4sqit","text":"This is in comparison to a different customer segment who has to say use it in a heavy construction setting.","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":0,"length":108,"style":"BOLD"}],"entityRanges":[],"data":{}}],"entityMap":{}}',
    })
  );
  shapes.push(
    new LiveObject({
      id: uuidv4(),
      type: "card",
      x: 100,
      y: 100,
      color: "#EAFBE3",
      width: 440,
      height: 298,
      cardTitle: "Pickup eg: Transportation - Passenger Vehicles",
      subtype: "example_industry_market_segment_card",
      draftRaw:
        '{"blocks":[{"key":"5hdom","text":"This is in addition to other Transportation segments like Farming, Commercial, Military, Aerospace, Marine, Rail etc.","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":0,"length":117,"style":"BOLD"}],"entityRanges":[],"data":{}}],"entityMap":{}}',
    })
  );

  return shapes;
}

export function createBrainstormExampleCards() {
  const shapes: LiveList<LiveObject<any>> = new LiveList([]);
  shapes.push(
    new LiveObject({
      id: uuidv4(),
      type: "example_brainstorm_card",
      x: 100,
      y: 100,
      width: 997,
      height: 450,
      subtype: null,
    })
  );

  return shapes;
}
