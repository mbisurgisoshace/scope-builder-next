"use client";

import { useEffect, useState } from "react";

import { Loader } from "@/components/ui/loader";
import { getMarketData, type MarketData } from "@/services/market";
import { getExampleMarketData } from "@/services/examples";
import { StakeholdersSection } from "./StakeholdersSection";
import { MarketSegmentsSection } from "./MarketSegmentsSection";

interface MarketProps {
  readOnly?: boolean;
  exampleNumber?: number;
}

export function Market({ readOnly = false, exampleNumber }: MarketProps) {
  const [data, setData] = useState<MarketData | null>(null);

  // Market data is org-wide (not per-milestone), so load once on mount.
  useEffect(() => {
    let active = true;
    const load =
      exampleNumber != null
        ? getExampleMarketData(exampleNumber)
        : getMarketData();
    load.then((result) => {
      if (active) setData(result);
    });
    return () => {
      active = false;
    };
  }, [exampleNumber]);

  if (!data) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white p-6">
      {/* Stakeholders grows to fill, pushing Market Segments to the bottom. */}
      <div className="flex-1">
        <StakeholdersSection rows={data.stakeholderRows} readOnly={readOnly} />
      </div>

      {/* Gray divider separating the two parts (matches the design). */}
      <div className="my-6 border-t border-[#D5D8E2]" />

      <MarketSegmentsSection
        segments={data.segments}
        note={data.note?.content ?? ""}
        readOnly={readOnly}
      />
    </div>
  );
}
