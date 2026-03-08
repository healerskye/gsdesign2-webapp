"use client";

export type TabId =
  | "fd-ahr"
  | "fd-fh"
  | "fd-rd"
  | "gs-ahr"
  | "gs-wlr"
  | "gs-rd"
  | "power-ahr"
  | "ahr"
  | "expected-event"
  | "expected-time";

const TABS: { id: TabId; label: string; group: string }[] = [
  { id: "fd-ahr", label: "AHR", group: "Fixed Design" },
  { id: "fd-fh", label: "Fleming-Harrington", group: "Fixed Design" },
  { id: "fd-rd", label: "Risk Difference", group: "Fixed Design" },
  { id: "gs-ahr", label: "AHR", group: "GS Design" },
  { id: "gs-wlr", label: "Weighted LR", group: "GS Design" },
  { id: "gs-rd", label: "Risk Diff", group: "GS Design" },
  { id: "power-ahr", label: "AHR", group: "Power" },
  { id: "ahr", label: "AHR", group: "Explore" },
  { id: "expected-event", label: "Events", group: "Explore" },
  { id: "expected-time", label: "Time", group: "Explore" },
];

interface TabNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function TabNav({ active, onChange }: TabNavProps) {
  const groups = Array.from(new Set(TABS.map((t) => t.group)));

  return (
    <nav className="border-b border-slate-200 bg-white px-6">
      <div className="flex items-end gap-6 overflow-x-auto">
        {groups.map((group) => (
          <div key={group} className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 pb-1">{group}</span>
            <div className="flex gap-1">
              {TABS.filter((t) => t.group === group).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onChange(tab.id)}
                  className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    active === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
