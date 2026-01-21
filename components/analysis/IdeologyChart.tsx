// ============================================================================
// Hardware Source: components/analysis/IdeologyChart.tsx
// Version: 1.0.0 — 2026-01-20
// Why: Visualize Ideological Tendencies (Chart 2)
// Env / Identity: UI Component
// ============================================================================

"use client";

import { IdeologicalProfile } from "@/lib/analysis/types";
import { Info } from "lucide-react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

const LABELS: Record<string, string> = {
    progressive_left: "چپ مترقی (Progressive)",
    center_left_reformist: "اصلاح‌طلب (Reformist)",
    pragmatic_center: "میانه‌گرای عمل‌گرا (Pragmatic Center)",
    center_right_conservative: "محافظه‌کار (Conservative)",
    national_right: "راست ملی‌گرا (National Right)",
    radical_left: "چپ رادیکال (Radical Left)",
    radical_right: "راست رادیکال (Radical Right)",
};

const COLORS: Record<string, string> = {
    progressive_left: "#ec4899",
    center_left_reformist: "#60a5fa",
    pragmatic_center: "#94a3b8",
    center_right_conservative: "#6366f1",
    national_right: "#d97706",
    radical_left: "#e11d48",
    radical_right: "#c2410c",
};

export function IdeologyChart({ data }: { data?: IdeologicalProfile }) {
    if (!data || !data.tendencies) return null;

    // Filter out zero values and sort by magnitude
    const items = Object.entries(data.tendencies)
        .filter(([, val]) => val > 0)
        .sort((a, b) => b[1] - a[1]);

    if (items.length === 0) return <div className="text-center text-slate-400 text-sm">اطلاعات کافی برای تخمین گرایش ایدئولوژیک موجود نیست.</div>;

    const chartData = items.map(([key, value]) => ({
        key,
        name: LABELS[key] || key,
        value,
        color: COLORS[key] || "#64748b",
    }));

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-6 shadow-sm">
                <div className="h-72 sm:h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius="55%"
                                outerRadius="85%"
                                paddingAngle={3}
                                stroke="#ffffff"
                                strokeWidth={2}
                            >
                                {chartData.map((entry) => (
                                    <Cell key={entry.key} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#ffffff",
                                    borderColor: "#e2e8f0",
                                    color: "#1e293b",
                                    borderRadius: "12px",
                                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                    fontSize: "12px",
                                    fontFamily: "var(--font-vazir)",
                                }}
                                itemStyle={{ color: "#0f172a" }}
                                formatter={(value: number | undefined, name: string | undefined) => {
                                    const displayValue = typeof value === "number" ? value : 0;
                                    return [`${displayValue}%`, name || ""];
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-2 text-[11px] text-slate-600">
                    {chartData.map((entry) => (
                        <div
                            key={entry.key}
                            className="flex items-center gap-2 bg-white/80 border border-slate-100 rounded-full px-3 py-1 shadow-sm"
                        >
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="font-semibold text-slate-700">{entry.name}</span>
                            <span className="font-mono text-slate-400">{entry.value}%</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/50 flex gap-3 text-right">
                <Info className="w-5 h-5 text-slate-400 min-w-[20px] mt-0.5" />
                <div>
                    <p className="text-xs text-slate-600 leading-6 text-justify">
                        {data.interpretation}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2 border-t border-slate-200 pt-2">
                        {data.disclaimer}
                    </p>
                </div>
            </div>
        </div>
    );
}
