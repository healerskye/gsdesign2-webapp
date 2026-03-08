"use client";
import { useState } from "react";
import { InputField } from "@/components/ui/InputField";
import { api } from "@/lib/api";
import { ApiResponse } from "@/types/gsdesign2";

interface Props {
  onResult: (r: ApiResponse<unknown>) => void;
}

export function FixedDesignRd({ onResult }: Props) {
  const [loading, setLoading] = useState(false);
  const [alpha, setAlpha] = useState("0.025");
  const [power, setPower] = useState("0.9");
  const [ratio, setRatio] = useState("1");
  const [pC, setPC] = useState("0.2");
  const [pE, setPE] = useState("0.15");
  const [rd0, setRd0] = useState("0");

  const run = async () => {
    setLoading(true);
    try {
      const result = await api.fixedDesignRd({
        alpha: parseFloat(alpha),
        power: parseFloat(power),
        ratio: parseFloat(ratio),
        p_c: parseFloat(pC),
        p_e: parseFloat(pE),
        rd0: parseFloat(rd0),
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
      <h2 className="text-lg font-semibold text-slate-800">Fixed Design - Risk Difference</h2>
      <p className="text-xs text-slate-500">Risk difference test for binary endpoints in a fixed design.</p>

      <div className="grid grid-cols-2 gap-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide col-span-2">Hypothesis</p>
        <InputField label="Alpha (one-sided)" name="alpha" value={alpha} onChange={setAlpha} step={0.005} min={0.001} max={0.5} />
        <InputField label="Power" name="power" value={power} onChange={setPower} step={0.05} min={0.5} max={0.999} />
        <InputField label="Randomization Ratio" name="ratio" value={ratio} onChange={setRatio} step={0.5} min={0.1} helpText="Experimental / Control" />

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide col-span-2 mt-2">Binary Endpoint</p>
        <InputField label="Control Rate (p_c)" name="p_c" value={pC} onChange={setPC} step={0.05} min={0.001} max={0.999} />
        <InputField label="Experimental Rate (p_e)" name="p_e" value={pE} onChange={setPE} step={0.05} min={0.001} max={0.999} />
        <InputField label="Null Risk Difference (rd0)" name="rd0" value={rd0} onChange={setRd0} step={0.01} helpText="H0: p_e - p_c = rd0" />
      </div>

      <button onClick={run} disabled={loading}
        className="mt-2 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
        {loading ? "Computing..." : "Calculate"}
      </button>
    </div>
  );
}
