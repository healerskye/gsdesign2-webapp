"use client";
import { useState } from "react";
import { InputField, SelectField } from "@/components/ui/InputField";
import { api } from "@/lib/api";
import { ApiResponse } from "@/types/gsdesign2";

interface Props {
  onResult: (r: ApiResponse<unknown>) => void;
}

export function GSDesignAhr({ onResult }: Props) {
  const [loading, setLoading] = useState(false);
  const [alpha, setAlpha] = useState("0.025");
  const [beta, setBeta] = useState("0.1");
  const [ratio, setRatio] = useState("1");
  const [enrollDuration, setEnrollDuration] = useState("12");
  const [enrollRateValue, setEnrollRateValue] = useState("41.67");
  const [medianControl, setMedianControl] = useState("12");
  const [delayDuration, setDelayDuration] = useState("4");
  const [hrDelay, setHrDelay] = useState("1");
  const [hrAfter, setHrAfter] = useState("0.6");
  const [dropoutRate, setDropoutRate] = useState("0.001");
  const [analysisTime, setAnalysisTime] = useState("12,24,36");
  const [infoFrac, setInfoFrac] = useState("");
  const [binding, setBinding] = useState(false);
  const [upperSpending, setUpperSpending] = useState("sfLDOF");
  const [upperParam, setUpperParam] = useState("-4");
  const [lowerSpending, setLowerSpending] = useState("sfLDOF");
  const [lowerParam, setLowerParam] = useState("-2");
  const [infoScale, setInfoScale] = useState("h0_h1_info");

  const spendingOptions = [
    { value: "sfLDOF", label: "Lan-DeMets O'Brien-Fleming" },
    { value: "sfLDPocock", label: "Lan-DeMets Pocock" },
    { value: "sfHSD", label: "Hwang-Shih-DeCani" },
  ];

  const infoScaleOptions = [
    { value: "h0_h1_info", label: "H0-H1 info" },
    { value: "h0_info", label: "H0 info" },
    { value: "h1_info", label: "H1 info" },
  ];

  const run = async () => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        alpha: parseFloat(alpha),
        beta: parseFloat(beta),
        ratio: parseFloat(ratio),
        enroll_duration: parseFloat(enrollDuration),
        enroll_rate_value: parseFloat(enrollRateValue),
        median_control: parseFloat(medianControl),
        delay_duration: parseFloat(delayDuration),
        hr_delay: parseFloat(hrDelay),
        hr_after: parseFloat(hrAfter),
        dropout_rate: parseFloat(dropoutRate),
        analysis_time: analysisTime,
        binding: binding,
        upper_spending: upperSpending,
        upper_param: parseFloat(upperParam),
        lower_spending: lowerSpending,
        lower_param: parseFloat(lowerParam),
        info_scale: infoScale,
      };
      if (infoFrac.trim()) {
        body.info_frac = infoFrac;
      }
      const result = await api.gsDesignAhr(body);
      onResult(result as ApiResponse<unknown>);
    } catch (e) {
      onResult({ success: false, error: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-800">GS Design - AHR</h2>
      <p className="text-xs text-slate-500">Group sequential design using average hazard ratio.</p>

      <div className="grid grid-cols-2 gap-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide col-span-2">Hypothesis</p>
        <InputField label="Alpha (one-sided)" name="gs-ahr-alpha" value={alpha} onChange={setAlpha} step={0.005} min={0.001} max={0.5} />
        <InputField label="Beta (Type II error)" name="gs-ahr-beta" value={beta} onChange={setBeta} step={0.05} min={0.01} max={0.5} helpText="Power = 1 - beta" />
        <InputField label="Randomization Ratio" name="gs-ahr-ratio" value={ratio} onChange={setRatio} step={0.5} min={0.1} helpText="Experimental / Control" />

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide col-span-2 mt-2">Enrollment</p>
        <InputField label="Enrollment Duration" name="gs-ahr-enroll-dur" value={enrollDuration} onChange={setEnrollDuration} step={1} min={1} />
        <InputField label="Enrollment Rate" name="gs-ahr-enroll-rate" value={enrollRateValue} onChange={setEnrollRateValue} step={1} min={1} helpText="Subjects per month" />

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide col-span-2 mt-2">Treatment Effect</p>
        <InputField label="Median Control (months)" name="gs-ahr-median" value={medianControl} onChange={setMedianControl} step={1} min={1} />
        <InputField label="Delay Duration (months)" name="gs-ahr-delay" value={delayDuration} onChange={setDelayDuration} step={1} min={0} helpText="Delay before treatment effect" />
        <InputField label="HR During Delay" name="gs-ahr-hr-delay" value={hrDelay} onChange={setHrDelay} step={0.1} min={0.01} max={2} />
        <InputField label="HR After Delay" name="gs-ahr-hr-after" value={hrAfter} onChange={setHrAfter} step={0.05} min={0.01} max={2} />
        <InputField label="Dropout Rate" name="gs-ahr-dropout" value={dropoutRate} onChange={setDropoutRate} step={0.001} min={0} max={1} />

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide col-span-2 mt-2">Analysis Timing</p>
        <InputField label="Analysis Times" name="gs-ahr-analysis-time" type="text" value={analysisTime} onChange={setAnalysisTime} helpText="Comma-separated months, e.g. 12,24,36" />
        <InputField label="Information Fraction" name="gs-ahr-info-frac" type="text" value={infoFrac} onChange={setInfoFrac} helpText="Optional comma-separated, e.g. 0.33,0.67,1" />
        <SelectField label="Info Scale" name="gs-ahr-info-scale" value={infoScale} onChange={setInfoScale} options={infoScaleOptions} />

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide col-span-2 mt-2">Spending Functions</p>
        <SelectField label="Upper Spending" name="gs-ahr-upper-sf" value={upperSpending} onChange={setUpperSpending} options={spendingOptions} />
        <InputField label="Upper Parameter" name="gs-ahr-upper-param" value={upperParam} onChange={setUpperParam} step={1} helpText="HSD: gamma param" />
        <SelectField label="Lower Spending" name="gs-ahr-lower-sf" value={lowerSpending} onChange={setLowerSpending} options={spendingOptions} />
        <InputField label="Lower Parameter" name="gs-ahr-lower-param" value={lowerParam} onChange={setLowerParam} step={1} helpText="HSD: gamma param" />

        <div className="col-span-2 flex items-center gap-2 mt-1">
          <input type="checkbox" id="gs-ahr-binding" checked={binding} onChange={(e) => setBinding(e.target.checked)} className="rounded border-slate-300" />
          <label htmlFor="gs-ahr-binding" className="text-sm text-slate-700">Binding futility bound</label>
        </div>
      </div>

      <button onClick={run} disabled={loading}
        className="mt-2 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
        {loading ? "Computing..." : "Calculate"}
      </button>
    </div>
  );
}
