"use client";
import { useState } from "react";
import { Header } from "@/components/Header";
import { TabNav, TabId } from "@/components/TabNav";
import { SplitPanel } from "@/components/SplitPanel";
import { FixedDesignAhr } from "@/components/modules/FixedDesignAhr";
import { FixedDesignFh } from "@/components/modules/FixedDesignFh";
import { FixedDesignRd } from "@/components/modules/FixedDesignRd";
import { GSDesignAhr } from "@/components/modules/GSDesignAhr";
import { GSDesignWlr } from "@/components/modules/GSDesignWlr";
import { GSDesignRd } from "@/components/modules/GSDesignRd";
import { PowerAhr } from "@/components/modules/PowerAhr";
import { AhrExplore } from "@/components/modules/AhrExplore";
import { ExpectedEvent } from "@/components/modules/ExpectedEvent";
import { ExpectedTime } from "@/components/modules/ExpectedTime";
import { ResultTable } from "@/components/ui/ResultTable";
import { ResultChart } from "@/components/ui/ResultChart";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { ApiResponse } from "@/types/gsdesign2";

function ResultPanel({ result }: { result: ApiResponse<unknown> | null }) {
  if (!result) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        Run a calculation to see results here.
      </div>
    );
  }

  // Handle error responses (both formats from API)
  const errorMsg = result.error || result.message;
  if (errorMsg && (result.status === "error" || result.success === false)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 max-w-md">
          <p className="font-semibold mb-1">Error</p>
          <p>{errorMsg}</p>
        </div>
      </div>
    );
  }

  const r = result as Record<string, unknown>;

  // Check if this is a GS design result (has bound and analysis arrays)
  const hasBound = Array.isArray(r.bound);
  const hasAnalysis = Array.isArray(r.analysis);
  const hasData = Array.isArray(r.data);
  const hasExpectedEvent = typeof r.expected_event === "number";

  if (hasBound && hasAnalysis) {
    // GS Design result
    const boundRows = r.bound as Record<string, unknown>[];
    const analysisRows = r.analysis as Record<string, unknown>[];

    // Chart: Z boundaries by analysis
    const upperBounds = boundRows.filter((b) => b.bound === "upper");
    const chartData = upperBounds.map((b, i) => ({
      stage: (b.analysis as number) || i + 1,
      value: typeof b.z === "number" ? b.z : 0,
    }));

    return (
      <div className="flex flex-col gap-5 min-w-0 w-full">
        <ResultTable data={boundRows as Record<string, string | number | number[]>[]} caption="Boundaries" />
        <ResultTable data={analysisRows as Record<string, string | number | number[]>[]} caption="Analysis Summary" />
        {chartData.length > 1 && <ResultChart data={chartData} yLabel="Z-value" title="Upper Boundary by Analysis" />}
        {typeof r.rCode === "string" && <CodeBlock code={r.rCode} />}
      </div>
    );
  }

  if (hasData) {
    // AHR explore or expected-time array result
    const dataRows = r.data as Record<string, unknown>[];
    const chartData = dataRows.map((d, i) => ({
      stage: (d.time as number) || (d.total_duration as number) || i + 1,
      value: typeof d.ahr === "number" ? d.ahr : typeof d.event === "number" ? d.event : 0,
    }));
    const chartLabel = dataRows[0] && "ahr" in dataRows[0] ? "AHR" : "Value";

    return (
      <div className="flex flex-col gap-5 min-w-0 w-full">
        <ResultTable data={dataRows as Record<string, string | number | number[]>[]} caption="Results" />
        {chartData.length > 1 && <ResultChart data={chartData} yLabel={chartLabel} title={`${chartLabel} over Time`} />}
        {typeof r.rCode === "string" && <CodeBlock code={r.rCode} />}
      </div>
    );
  }

  if (hasExpectedEvent) {
    // Expected event scalar result
    return (
      <div className="flex flex-col gap-5 min-w-0 w-full">
        <div className="rounded-lg bg-green-50 border border-green-200 p-6 text-center">
          <p className="text-sm text-green-600 font-medium mb-1">Expected Events</p>
          <p className="text-3xl font-bold text-green-800">
            {typeof r.expected_event === "number" ? (r.expected_event as number).toFixed(2) : String(r.expected_event)}
          </p>
        </div>
        {typeof r.rCode === "string" && <CodeBlock code={r.rCode} />}
      </div>
    );
  }

  // Fixed design result - has analysis array at top level
  if (hasAnalysis && !hasBound) {
    const analysisRows = r.analysis as Record<string, unknown>[];
    return (
      <div className="flex flex-col gap-5 min-w-0 w-full">
        <ResultTable data={analysisRows as Record<string, string | number | number[]>[]} caption="Analysis Summary" />
        {typeof r.rCode === "string" && <CodeBlock code={r.rCode} />}
      </div>
    );
  }

  // Generic fallback - extract scalars and arrays from result
  const scalars = Object.entries(r).filter(
    ([k, v]) => typeof v === "number" && k !== "status" && k !== "success"
  );
  const arrayFields = Object.entries(r).filter(([, v]) => Array.isArray(v));
  const rowCount = arrayFields.length > 0 ? (arrayFields[0][1] as unknown[]).length : 0;
  const tableData = Array.from({ length: rowCount }, (_, i) => {
    const row: Record<string, unknown> = { Stage: i + 1 };
    for (const [key, val] of arrayFields) {
      const arr = val as number[];
      row[key] = typeof arr[i] === "number" ? Math.round(arr[i] * 10000) / 10000 : arr[i];
    }
    return row;
  });

  return (
    <div className="flex flex-col gap-5 min-w-0 w-full">
      {scalars.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {scalars.map(([key, val]) => (
            <div key={key} className="rounded-lg bg-green-50 border border-green-200 p-3">
              <p className="text-xs text-green-600 font-medium">{key}</p>
              <p className="text-xl font-bold text-green-800">
                {typeof val === "number"
                  ? Math.abs(val) < 1
                    ? val.toFixed(4)
                    : Math.round(val as number)
                  : String(val)}
              </p>
            </div>
          ))}
        </div>
      )}
      {tableData.length > 0 && (
        <ResultTable data={tableData as Record<string, string | number | number[]>[]} caption="Results" />
      )}
      {typeof r.rCode === "string" && <CodeBlock code={r.rCode} />}
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState<TabId>("fd-ahr");
  const [results, setResults] = useState<Partial<Record<TabId, ApiResponse<unknown>>>>({});

  const onResult = (r: ApiResponse<unknown>) => setResults((prev) => ({ ...prev, [tab]: r }));

  const leftPanel: Record<TabId, React.ReactNode> = {
    "fd-ahr": <FixedDesignAhr onResult={onResult} />,
    "fd-fh": <FixedDesignFh onResult={onResult} />,
    "fd-rd": <FixedDesignRd onResult={onResult} />,
    "gs-ahr": <GSDesignAhr onResult={onResult} />,
    "gs-wlr": <GSDesignWlr onResult={onResult} />,
    "gs-rd": <GSDesignRd onResult={onResult} />,
    "power-ahr": <PowerAhr onResult={onResult} />,
    ahr: <AhrExplore onResult={onResult} />,
    "expected-event": <ExpectedEvent onResult={onResult} />,
    "expected-time": <ExpectedTime onResult={onResult} />,
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <TabNav active={tab} onChange={setTab} />
      <div className="flex-1 flex overflow-hidden">
        <SplitPanel left={leftPanel[tab]} right={<ResultPanel result={results[tab] ?? null} />} />
      </div>
    </div>
  );
}
