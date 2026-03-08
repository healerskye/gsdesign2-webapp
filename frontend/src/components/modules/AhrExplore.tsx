"use client";
import { useState } from "react";
import { InputField } from "@/components/ui/InputField";
import { api } from "@/lib/api";
import { ApiResponse } from "@/types/gsdesign2";

interface Props {
  onResult: (r: ApiResponse<unknown>) => void;
}

export function AhrExplore({ onResult }: Props) {
  const [loading, setLoading] = useState(false);
  const [enrollDuration, setEnrollDuration] = useState("12");
  const [enrollRateValue, setEnrollRateValue] = useState("41.67");
  const [medianControl, setMedianControl] = useState("12");
  const [delayDuration, setDelayDuration] = useState("4");
  const [hrDelay, setHrDelay] = useState("1");
  const [hrAfter, setHrAfter] = useState("0.6");
  const [dropoutRate, setDropoutRate] = useState("0.001");
  const [ratio, setRatio] = useState("1");
  const [totalDuration, setTotalDuration] = useState("6,12,18,24,30,36,42,48");

  const run = async () => {
    setLoading(true);
    try {
      const result = await api.ahr({
        enroll_duration: parseFloat(enrollDuration),
        enroll_rate_value: parseFloat(enrollRateValue),
        median_control: parseFloat(medianControl),
        delay_duration: parseFloat(delayDuration),
        hr_delay: parseFloat(hrDelay),
        hr_after: parseFloat(hrAfter),
        dropout_rate: parseFloat(dropoutRate),
        ratio: parseFloat(ratio),
        total_duration: totalDuration,
      });
      onResult(result as ApiResponse<unknown>);
    } catch (e) {
      onResult({ success: false, error: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-800">AHR Exploration</h2>
      <p className="text-xs text-slate-500">Explore the average hazard ratio over time under non-proportional hazards.</p>

      <div className="grid grid-cols-2 gap-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide col-span-2">Enrollment</p>
        <InputField label="Enrollment Duration" name="ahr-enroll-dur" value={enrollDuration} onChange={setEnrollDuration} step={1} min={1} />
        <InputField label="Enrollment Rate" name="ahr-enroll-rate" value={enrollRateValue} onChange={setEnrollRateValue} step={1} min={1} helpText="Subjects per month" />
        <InputField label="Randomization Ratio" name="ahr-ratio" value={ratio} onChange={setRatio} step={0.5} min={0.1} helpText="Experimental / Control" />

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide col-span-2 mt-2">Treatment Effect</p>
        <InputField label="Median Control (months)" name="ahr-median" value={medianControl} onChange={setMedianControl} step={1} min={1} />
        <InputField label="Delay Duration (months)" name="ahr-delay" value={delayDuration} onChange={setDelayDuration} step={1} min={0} helpText="Delay before treatment effect" />
        <InputField label="HR During Delay" name="ahr-hr-delay" value={hrDelay} onChange={setHrDelay} step={0.1} min={0.01} max={2} />
        <InputField label="HR After Delay" name="ahr-hr-after" value={hrAfter} onChange={setHrAfter} step={0.05} min={0.01} max={2} />
        <InputField label="Dropout Rate" name="ahr-dropout" value={dropoutRate} onChange={setDropoutRate} step={0.001} min={0} max={1} />

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide col-span-2 mt-2">Evaluation</p>
        <InputField label="Total Duration(s)" name="ahr-total-dur" type="text" value={totalDuration} onChange={setTotalDuration} helpText="Comma-separated months to evaluate" />
      </div>

      <button onClick={run} disabled={loading}
        className="mt-2 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
        {loading ? "Computing..." : "Calculate"}
      </button>
    </div>
  );
}
