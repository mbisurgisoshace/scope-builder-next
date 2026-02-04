"use client";

import { Button } from "@/components/ui/button";
import { createHypothesis } from "@/services/hypothesis";

export default function CreateHypothesisButton() {
  return (
    <Button
      className="ml-auto"
      onClick={async () => {
        await createHypothesis();
      }}
    >
      + Create
    </Button>
  );
}
