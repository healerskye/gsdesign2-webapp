"use client";
import { useState } from "react";
import { InputField, SelectField } from "@/components/ui/InputField";
import { api } from "@/lib/api";
import { ApiResponse } from "@/types/gsdesign2";

interface Props {
  onResult: (r: ApiResponse<unknown>) => void;
}

export function GSDesignRd({ onResult }: Props) {
  const [loading, setLoading] = useState(false);
  const [alpha, setAlpha] = useState("0.025");
  const [beta, setBeta] = useState("0.1");
  const [ratio, setRatio] = useState("1");
  const [pC, setPC] = useState("0.2");
  const [pE, setPE] = useState("0.15");
  const [rd0, setRd0] = useState("0");
  const [infoFrac, setInfoFrac] = useState("0.333,0.667,1");
  const [binding, setBinding] = useState(false);
  const [upperSpending, setUpperSpending] = useState("sfLDOF");
  const [upperParam, setUpperParam] = useState("-4");
  const [lowerSpending, setLowerSpending] = useState("sfLDOF");
  const [lowerParam, setLowerParam] = useState("-2");

  const spendingOptions = [
    { value: "sfLDOF", label: "Lan-DeMets O'Brien-Fleming" },
    { value: "sfLDPocock", label: "Lan-DeMets Pocock" },
    { value: "sfHSD", label: "Hwang-Shih-DeCani" },
  ];

  const run = async () => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        alpha: parseFloat(alpha),
        beta: parseFloat(beta),
        ratio: parseFloat(ratio),
        p_c: parseFloat(pC),
        p_e: parseFloat(pE),
        rd0: parseFloat(rd0),
        info_frac: infoFrac,
        binding: binding,
        upper_spending: upperSpending,
        upper_param: parseFloat(upperParam),
        lower_spending: lowerSpending,
        lower_param: parseFloat(lowerParam),
      };
      const result = await api.gsDesignRd(body);
      onResult(result as ApiResponse<unknown>);
    } catch (e) {
      onResult({ success: false, error: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-800">GS Design - Risk Difference</h2>
      <p className="text-xs text-slate-500">Group sequential design for binary endpoints using risk difference.</p>

      <div className="grid grid-cols-2 gap-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide col-span-2">Hypothesis</p>
        <InputField label="Alpha (one-sided)" name="gs-rd-alpha" value={alpha} onChange={setAlpha} step={0.005} min={0.001} max={0.5} />
        <InputField label="Beta (Type II error)" name="gs-rd-beta" value={beta} onChange={setBeta} step={0.05} min={0.01} max={0.5} helpText="Power = 1 - beta" />
        <InputField label="Randomization Ratio" name="gs-rd-ratio" value={ratio} onChange={setRatio} step={0.5} min={0.1} helpText="Experimental / Control" />

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide col-span-2 mt-2">Binary Endpoint</p>
        <InputField label="Control Rate (p_c)" name="gs-rd-p-c" value={pC} onChange={setPC} step={0.05} min={0.001} max={0.999} />
        <InputField label="Experimental Rate (p_e)" name="gs-rd-p-e" value={pE} onChange={setPE} step={0.05} min={0.001} max={0.999} />
        <InputField label="Null Risk Difference (rd0)" name="gs-rd-rd0" value={rd0} onChange={setRd0} step={0.01} helpText="H0: p_e - p_c = rd0" />

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide col-span-2 mt-2">Analysis Timing</p>
        <InputField label="Information Fraction" name="gs-rd-info-frac" type="text" value={infoFrac} onChange={setInfoFrac} helpText="Comma-separated, e.g. 0.333,0.667,1" />

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide col-span-2 mt-2">Spending Functions</p>
        <SelectField label="Upper Spending" name="gs-rd-upper-sf" value={upperSpending} onChange={setUpperSpending} options={spendingOptions} />
        <InputField label="Upper Parameter" name="gs-rd-upper-param" value={upperParam} onChange={setUpperParam} step={1} helpText="HSD: gamma param" />
        <SelectField label="Lower Spending" name="gs-rd-lower-sf" value={lowerSpending} onChange={setLowerSpending} options={spendingOptions} />
        <InputField label="Lower Parameter" name="gs-rd-lower-param" value={lowerParam} onChange={setLowerParam} step={1} helpText="HSD: gamma param" />

        <div className="col-span-2 flex items-center gap-2 mt-1">
          <input type="checkbox" id="gs-rd-binding" checked={binding} onChange={(e) => setBinding(e.target.checked)} className="rounded border-slate-300" />
          <label htmlFor="gs-rd-binding" className="text-sm text-slate-700">Binding futility bound</label>
        </div>
      </div>

      <button onClick={run} disabled={loading}
        className="mt-2 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
        {loading ? "Computing..." : "Calculate"}
      </button>
    </div>
  );
}
