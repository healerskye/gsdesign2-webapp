"use client";
import { useState } from "react";
import { InputField } from "@/components/ui/InputField";
import { api } from "@/lib/api";
import { ApiResponse } from "@/types/gsdesign2";

interface Props {
  onResult: (r: ApiResponse<unknown>) => void;
}

export function FixedDesignAhr({ onResult }: Props) {
  const [loading, setLoading] = useState(false);
  const [alpha, setAlpha] = useState("0.025");
  const [power, setPower] = useState("0.9");
  const [ratio, setRatio] = useState("1");
  const [studyDuration, setStudyDuration] = useState("36");
  const [enrollDuration, setEnrollDuration] = useState("18");
  const [enrollRateValue, setEnrollRateValue] = useState("20");
  const [medianControl, setMedianControl] = useState("12");
  const [delayDuration, setDelayDuration] = useState("4");
  const [hrDelay, setHrDelay] = useState("1");
  const [hrAfter, setHrAfter] = useState("0.6");
  const [dropoutRate, setDropoutRate] = useState("0.001");

  const run = async () => {
    setLoading(true);
    try {
      const result = await api.fixedDesignAhr({
        alpha: parseFloat(alpha),
        power: parseFloat(power),
        ratio: parseFloat(ratio),
        study_duration: parseFloat(studyDuration),
        enroll_duration: parseFloat(enrollDuration),
        enroll_rate_value: parseFloat(enrollRateValue),
        median_control: parseFloat(medianControl),
        delay_duration: parseFloat(delayDuration),
        hr_delay: parseFloat(hrDelay),
        hr_after: parseFloat(hrAfter),
        dropout_rate: parseFloat(dropoutRate),
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
      <h2 className="text-lg font-semibold text-slate-800">Fixed Design - AHR</h2>
      <p className="text-xs text-slate-500">Average hazard ratio method for fixed (single-analysis) design.</p>

      <div className="grid grid-cols-2 gap-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide col-span-2">Hypothesis</p>
        <InputField label="Alpha (one-sided)" name="alpha" value={alpha} onChange={setAlpha} step={0.005} min={0.001} max={0.5} />
        <InputField label="Power" name="power" value={power} onChange={setPower} step={0.05} min={0.5} max={0.999} />
        <InputField label="Randomization Ratio" name="ratio" value={ratio} onChange={setRatio} step={0.5} min={0.1} helpText="Experimental / Control" />
        <InputField label="Study Duration (months)" name="study_duration" value={studyDuration} onChange={setStudyDuration} step={1} min={1} />

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide col-span-2 mt-2">Enrollment</p>
        <InputField label="Enrollment Duration" name="enroll_duration" value={enrollDuration} onChange={setEnrollDuration} step={1} min={1} />
        <InputField label="Enrollment Rate" name="enroll_rate_value" value={enrollRateValue} onChange={setEnrollRateValue} step={1} min={1} helpText="Subjects per month" />

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide col-span-2 mt-2">Treatment Effect</p>
        <InputField label="Median Control (months)" name="median_control" value={medianControl} onChange={setMedianControl} step={1} min={1} />
        <InputField label="Delay Duration (months)" name="delay_duration" value={delayDuration} onChange={setDelayDuration} step={1} min={0} helpText="Delay before treatment effect" />
        <InputField label="HR During Delay" name="hr_delay" value={hrDelay} onChange={setHrDelay} step={0.1} min={0.01} max={2} />
        <InputField label="HR After Delay" name="hr_after" value={hrAfter} onChange={setHrAfter} step={0.05} min={0.01} max={2} />
        <InputField label="Dropout Rate" name="dropout_rate" value={dropoutRate} onChange={setDropoutRate} step={0.001} min={0} max={1} />
      </div>

      <button onClick={run} disabled={loading}
        className="mt-2 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
        {loading ? "Computing..." : "Calculate"}
      </button>
    </div>
  );
}
