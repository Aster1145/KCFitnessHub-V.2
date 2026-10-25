import { addDaysStr, todayStr } from "@/lib/dates";

/** Month grid heatmap — volt = trained, red = counted as absent, muted = future. */
export default function Heatmap({
  attended,
  monthOffset = 0,
}: {
  attended: Set<string>;
  monthOffset?: number;
}) {
  const today = todayStr();
  const base = new Date(today + "T00:00:00");
  const first = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
  const monthName = first.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();

  // Monday-first offset
  const lead = (first.getDay() + 6) % 7;
  const cells: (string | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 0; d < daysInMonth; d++) {
    cells.push(addDaysStr(
      `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}-01`,
      d
    ));
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-200">{monthName}</p>
        <div className="flex items-center gap-3 text-[10px] tracking-wider text-zinc-500 uppercase">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-[3px] bg-volt" /> Trained
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-[3px] bg-red-400/50" /> Absent
          </span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div
            key={i}
            className="pb-1 text-center text-[10px] font-semibold text-zinc-600"
          >
            {d}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={`x${i}`} />;
          const isFuture = date > today;
          const isToday = date === today;
          const hit = attended.has(date);
          return (
            <div
              key={date}
              title={date}
              className={`flex aspect-square flex-col items-center justify-center rounded-lg text-[11px] font-medium transition-colors ${
                hit
                  ? "bg-volt text-carbon"
                  : isFuture
                    ? "bg-smoke/40 text-zinc-600"
                    : "bg-red-400/15 text-red-300/70"
              } ${isToday ? "ring-2 ring-volt ring-offset-2 ring-offset-steel" : ""}`}
            >
              {Number(date.slice(8))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
