// ============================================================================
// Hardware Source: components/analysis/DiscourseRadar.tsx
// Version: 1.0.0 — 2026-01-19
// Why: Visualize discourse analysis results using a Radar Chart
// Env / Identity: UI Component (Client Side)
// ============================================================================

"use client";

import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { AxisScore, DiscourseCluster } from "@/lib/analysis/types";

const CATEGORY_LABELS: Record<string, string> = {
    authority_orientation: "اقتدار",
    liberty_orientation: "آزادی فردی",
    ingroup_outgroup: "قبیله‌گرایی",
    conflict_tolerance: "تحمل تعارض",
};

interface DiscourseRadarProps {
    clusters?: DiscourseCluster[];
    axisScores?: {
        authority_orientation: AxisScore;
        liberty_orientation: AxisScore;
        ingroup_outgroup: AxisScore;
        conflict_tolerance: AxisScore;
    };
}

export function DiscourseRadar({ clusters, axisScores }: DiscourseRadarProps) {
    const data = [
        { subject: CATEGORY_LABELS.authority_orientation, value: 0, key: "authority_orientation" },
        { subject: CATEGORY_LABELS.liberty_orientation, value: 0, key: "liberty_orientation" },
        { subject: CATEGORY_LABELS.ingroup_outgroup, value: 0, key: "ingroup_outgroup" },
        { subject: CATEGORY_LABELS.conflict_tolerance, value: 0, key: "conflict_tolerance" },
    ];

    if (axisScores) {
        data.forEach((item) => {
            const axis = axisScores[item.key as keyof typeof axisScores];
            const normalized = Math.max(0, Math.min(100, ((axis.value + 10) / 20) * 100));
            item.value = Number(normalized.toFixed(1));
        });
    } else if (clusters && clusters.length > 0) {
        const fallbackMapping: Record<string, string> = {
            A: "authority_orientation",
            B: "liberty_orientation",
            C: "ingroup_outgroup",
            D: "conflict_tolerance",
        };

        clusters.forEach((cluster) => {
            const axisKey = fallbackMapping[cluster.mapped_category];
            const dataIndex = data.findIndex((item) => item.key === axisKey);
            if (dataIndex === -1) return;

            let score = 30;
            if (cluster.engagement_level === "Medium") score = 60;
            if (cluster.engagement_level === "High") score = 90;
            data[dataIndex].value = Math.max(data[dataIndex].value, score);
        });
    }

    return (
        <div className="h-80 w-full bg-slate-50/50 rounded-xl p-4 shadow-sm border border-slate-100 backdrop-blur-sm">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }}
                    />
                    <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={false}
                        axisLine={false}
                    />
                    <Radar
                        name="Discourse Intensity"
                        dataKey="value"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        fill="#8b5cf6"
                        fillOpacity={0.4}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#0f172a' }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
