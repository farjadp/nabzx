// ============================================================================
// Hardware Source: components/analysis/AxisScoresChart.tsx
// Version: 1.0.0 — 2026-01-19
// Why: Visualize axis scores (A-D) using a centered bar chart
// Env / Identity: UI Component (Client Side)
// ============================================================================

"use client";

import {
    BarChart,
    Bar,
    CartesianGrid,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Cell,
} from "recharts";
import { AxisScore } from "@/lib/analysis/types";

const AXIS_LABELS: Record<string, string> = {
    authority_orientation: "اقتدار",
    liberty_orientation: "آزادی فردی",
    ingroup_outgroup: "قبیله‌گرایی",
    conflict_tolerance: "تحمل تعارض",
};

interface AxisScoresChartProps {
    scores: {
        authority_orientation: AxisScore;
        liberty_orientation: AxisScore;
        ingroup_outgroup: AxisScore;
        conflict_tolerance: AxisScore;
    };
}

export function AxisScoresChart({ scores }: AxisScoresChartProps) {
    const data = [
        {
            key: "authority_orientation",
            label: AXIS_LABELS.authority_orientation,
            value: scores.authority_orientation.value,
        },
        {
            key: "liberty_orientation",
            label: AXIS_LABELS.liberty_orientation,
            value: scores.liberty_orientation.value,
        },
        {
            key: "ingroup_outgroup",
            label: AXIS_LABELS.ingroup_outgroup,
            value: scores.ingroup_outgroup.value,
        },
        {
            key: "conflict_tolerance",
            label: AXIS_LABELS.conflict_tolerance,
            value: scores.conflict_tolerance.value,
        },
    ];

    return (
        <div className="h-[320px] w-full bg-slate-50/60 rounded-2xl border border-slate-100 p-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                    <XAxis
                        type="number"
                        domain={[-10, 10]}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={false}
                    />
                    <YAxis
                        dataKey="label"
                        type="category"
                        width={100}
                        tick={{ fill: "#334155", fontSize: 12, fontWeight: 600 }}
                        axisLine={false}
                    />
                    <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
                    <Bar dataKey="value" barSize={18} radius={[6, 6, 6, 6]}>
                        {data.map((entry) => (
                            <Cell
                                key={entry.key}
                                fill={entry.value >= 0 ? "#10b981" : "#f97316"}
                            />
                        ))}
                    </Bar>
                    <Tooltip
                        cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
                        contentStyle={{
                            backgroundColor: "#ffffff",
                            borderColor: "#e2e8f0",
                            color: "#1e293b",
                            borderRadius: "12px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        formatter={(value: number | undefined, name, item) => {
                            const label = item?.payload?.label || name;
                            const displayValue = typeof value === "number" ? value : 0;
                            return [`${displayValue}`, label];
                        }}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
