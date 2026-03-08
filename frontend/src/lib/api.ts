const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

async function post<T>(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  fixedDesignAhr: (body: Record<string, unknown>) => post("/fixed-design-ahr", body),
  fixedDesignFh: (body: Record<string, unknown>) => post("/fixed-design-fh", body),
  fixedDesignRd: (body: Record<string, unknown>) => post("/fixed-design-rd", body),
  gsDesignAhr: (body: Record<string, unknown>) => post("/gs-design-ahr", body),
  gsDesignWlr: (body: Record<string, unknown>) => post("/gs-design-wlr", body),
  gsDesignRd: (body: Record<string, unknown>) => post("/gs-design-rd", body),
  gsPowerAhr: (body: Record<string, unknown>) => post("/gs-power-ahr", body),
  ahr: (body: Record<string, unknown>) => post("/ahr", body),
  expectedEvent: (body: Record<string, unknown>) => post("/expected-event", body),
  expectedTime: (body: Record<string, unknown>) => post("/expected-time", body),
};
