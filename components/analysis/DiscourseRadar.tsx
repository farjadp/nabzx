// ============================================================================
// Hardware Source: components/analysis/DiscourseRadar.tsx
// Version: 2.0.0 — 2026-01-20
// Why: Update to 5-axis model + Add Explanations
// Env / Identity: UI Component
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
import { CapacityDimensions } from "@/lib/analysis/types";
import { Info } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
    capacity_for_structure: "ظرفیت ساختار (Structure)",
    autonomy_sensitivity: "حساسیت به استقلال (Autonomy)",
    group_identity_strength: "هویت گروهی (Group)",
    confrontation_readiness: "آمادگی برخورد (Confrontation)",
    transformation_drive: "میل به تغییر (Transformation)",
};

const EXPLANATIONS = [
    {
        title: "ظرفیت ساختار (Structure)",
        desc: "تمایل به نظم، هماهنگی و تصمیم‌گیری متمرکز به عنوان یک قابلیت.",
        color: "text-rose-600",
        bg: "bg-rose-50",
    },
    {
        title: "حساسیت به استقلال (Autonomy)",
        desc: "توجه ویژه به آزادی عمل فردی و مقاومت در برابر اجبار بیرونی.",
        color: "text-blue-600",
        bg: "bg-blue-50",
    },
    {
        title: "هویت گروهی (Group)",
        desc: "اهمیت دادن به همبستگی درون‌گروهی و حفظ هویت جمعی.",
        color: "text-amber-600",
        bg: "bg-amber-50",
    },
    {
        title: "آمادگی برخورد (Confrontation)",
        desc: "توانایی مواجهه مستقیم با تعارض‌ها و تنش‌ها بدون اجتناب.",
        color: "text-purple-600",
        bg: "bg-purple-50",
    },
    {
        title: "میل به تغییر (Transformation)",
        desc: "انرژی و انگیزه برای ایجاد تغییرات سیستمی تدریجی یا سریع.",
        color: "text-orange-600",
        bg: "bg-orange-50",
    },
];

interface DiscourseRadarProps {
    dimensions?: CapacityDimensions;
}

export function DiscourseRadar({ dimensions }: DiscourseRadarProps) {
    const data = [
        { subject: CATEGORY_LABELS.capacity_for_structure, value: 0, key: "capacity_for_structure", fullMark: 100 },
        { subject: CATEGORY_LABELS.autonomy_sensitivity, value: 0, key: "autonomy_sensitivity", fullMark: 100 },
        { subject: CATEGORY_LABELS.group_identity_strength, value: 0, key: "group_identity_strength", fullMark: 100 },
        { subject: CATEGORY_LABELS.confrontation_readiness, value: 0, key: "confrontation_readiness", fullMark: 100 },
        { subject: CATEGORY_LABELS.transformation_drive, value: 0, key: "transformation_drive", fullMark: 100 },
    ];

    if (dimensions) {
        data.forEach((item) => {
            const val = dimensions[item.key as keyof CapacityDimensions];
            // Normalize -10 to +10 into 0 to 100
            if (typeof val === 'number') {
                const normalized = Math.max(0, Math.min(100, ((val + 10) / 20) * 100));
                item.value = Number(normalized.toFixed(1));
            }
        });
    }

    return (
        <div className="flex flex-col gap-8">
            {/* Chart Container */}
            <div className="h-96 w-full bg-slate-50/50 rounded-xl p-6 shadow-sm border border-slate-100 backdrop-blur-sm">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: '#64748b', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-vazir)' }}
                        />
                        <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={false}
                            axisLine={false}
                        />
                        <Radar
                            name="شدت گرایش"
                            dataKey="value"
                            stroke="#10b981"
                            strokeWidth={3}
                            fill="#10b981"
                            fillOpacity={0.2}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#ffffff',
                                borderColor: '#e2e8f0',
                                color: '#1e293b',
                                borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                fontSize: '12px',
                                fontFamily: 'var(--font-vazir)'
                            }}
                            itemStyle={{ color: '#0f172a' }}
                            formatter={(value?: number | string) => {
                                const displayValue = value ?? 0;
                                return [`${displayValue}%`, "شدت"];
                            }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Explanation Section (New) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EXPLANATIONS.map((exp, idx) => (
                    <div key={idx} className={`flex gap-3 p-3 rounded-xl border border-transparent ${exp.bg} bg-opacity-40`}>
                        <div className={`mt-1 min-w-[16px] ${exp.color}`}>
                            <Info className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className={`text-xs font-bold mb-1 ${exp.color}`}>{exp.title}</h4>
                            <p className="text-[10px] text-slate-600 leading-relaxed text-justify opacity-90">
                                {exp.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
