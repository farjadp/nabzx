"use client";

import { useState } from "react";
import { Vazirmatn } from "next/font/google";
import { DiscourseRadar } from "@/components/analysis/DiscourseRadar";
import { AxisScoresChart } from "@/components/analysis/AxisScoresChart";
import { AnalysisOutput } from "@/lib/analysis/types";
import {
  Sun,
  Search,
  Fingerprint,
  Cpu,
  AtSign,
  ArrowLeft,
  Feather,
  Quote,
  Zap,
  Clock
} from "lucide-react";

// فونت وزیرمتن با وزنهای مختلف
const vazir = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazir",
  display: "swap",
});

export default function Home() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "scraping" | "analyzing">("idle");
  const [result, setResult] = useState<AnalysisOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatMetaDate = (value?: string) => {
    if (!value) return "نامشخص";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "نامشخص";
    return parsed.toLocaleDateString("fa-IR");
  };

  const formatFocusLabel = (value?: string) => {
    if (!value) return "نامشخص";
    const normalized = value.trim();
    const map: Record<string, string> = {
      A: "اقتدار",
      B: "آزادی فردی",
      C: "قبیله‌گرایی",
      D: "تحمل تعارض",
      Mixed: "ترکیبی",
    };
    return map[normalized] || normalized;
  };

  const handleAnalyze = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setStep("scraping");
    setError(null);
    setResult(null);

    try {
      const cleanUsername = username.replace('@', '').trim();
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || errData.error || "خطا در ارتباط");
      }

      setStep("analyzing");
      const data = await response.json();
      if (
        !data ||
        data.status !== "success" ||
        !data.analysis_meta ||
        !Array.isArray(data.discourse_clusters) ||
        !data.axis_scores
      ) {
        throw new Error("پاسخ تحلیل نامعتبر است.");
      }
      setResult(data);

    } catch (err: any) {
      setError(err.message || "خطا رخ داد");
    } finally {
      setLoading(false);
      setStep("idle");
    }
  };

  return (
    <main
      className={`min-h-screen bg-[#F8FAFC] text-slate-800 ${vazir.className} selection:bg-emerald-200 selection:text-emerald-900`}
      dir="rtl"
    >
      {/* Background Elements: The "Dawn" Gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* خورشید طلوع کرده از سمت راست */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-gradient-to-b from-orange-100/40 to-emerald-100/40 rounded-full blur-[120px] mix-blend-multiply"></div>
        {/* نور سفید و شفاف پایین */}
        <div className="absolute bottom-0 left-[-10%] w-[500px] h-[500px] bg-sky-100/50 rounded-full blur-[100px] mix-blend-multiply"></div>
        {/* پترن نویز خیلی خیلی محو برای بافت کاغذ */}
        <div className="absolute inset-0 opacity-[0.015] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      </div>

      {/* Header: Minimal & Transparent */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20 text-white">
              <Sun className="w-6 h-6 animate-pulse-slow" />
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-tight text-slate-800">
                نـبـض <span className="text-emerald-600 font-light">آزادی</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">پلتفرم شفافیت گفتمانی | ۲۰۲۶</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
            <span className="hidden sm:inline-block px-3 py-1 bg-slate-100 rounded-full border border-slate-200">نسخه پایدار ۲.۱</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-12 gap-16 relative z-10">

        {/* LEFT COLUMN: Narrative & Input (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col gap-10 pt-4">

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-xs font-bold">
              <Zap className="w-3 h-3" />
              <span>موتور تحلیلگر زنده</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 leading-[1.2]">
              تصویر شفافِ <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-600 to-teal-500">
                افکار عمومی
              </span>
            </h2>
            <p className="text-slate-600 leading-8 text-lg text-justify border-r-4 border-emerald-500/30 pr-5">
              در دوران جدید، آگاهی حق همه است. با وارد کردن نام کاربری، بدون قضاوت و با تکیه بر دادههای آزاد، پروفایل گفتمانی و جایگاه فکری افراد را در سپهر سیاسی ایرانِ امروز مشاهده کنید.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

            <label className="text-sm font-bold text-slate-700 mb-4 block flex items-center gap-2">
              <AtSign className="w-4 h-4 text-emerald-500" />
              شناسه کاربری (توییتر/ایکس)
            </label>

            <div className="relative mb-6">
              <input
                type="text"
                dir="ltr"
                className="block w-full bg-slate-50 border-2 border-slate-100 text-slate-800 rounded-2xl py-4 px-6 text-xl font-mono focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-300 shadow-inner"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !username}
              className="w-full py-4 bg-slate-900 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-emerald-500/30"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="font-light">
                    {step === "scraping" ? "دریافت دادههای آزاد..." : "پردازش الگوی فکری..."}
                  </span>
                </>
              ) : (
                <>
                  <span>ترسیم نمودار</span>
                  <ArrowLeft className="w-5 h-5" />
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                {error}
              </div>
            )}
          </div>

          <div className="flex gap-6 opacity-80">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div className="text-xs text-slate-500 leading-tight">
                <strong className="block text-slate-700">حریم خصوصی</strong>
                بدون ذخیرهسازی
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="text-xs text-slate-500 leading-tight">
                <strong className="block text-slate-700">هوش مصنوعی</strong>
                نسخه دموکراتیک
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Results (lg:col-span-7) */}
        <div className="lg:col-span-7 min-h-[600px]">

          {!result && !loading ? (
            <div className="h-full border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 bg-white/50 backdrop-blur-sm">
              <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Feather className="w-12 h-12 text-slate-300" />
              </div>
              <p className="text-lg font-bold text-slate-500">بوم سفید تحلیل</p>
              <p className="text-sm mt-2 font-light">منتظر دریافت نام کاربری برای ترسیم واقعیت</p>
            </div>
          ) : null}

          {loading && !result && (
            <div className="h-full border border-slate-100 rounded-[2rem] bg-white p-10 shadow-xl flex flex-col items-center justify-center space-y-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sun className="w-8 h-8 text-emerald-500" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-slate-800 font-bold text-lg animate-pulse">در حال خواندن توییتها...</p>
                <p className="text-slate-400 text-sm">استخراج سیگنالهای گفتمانی از فضای عمومی</p>
              </div>
            </div>
          )}

          {result && (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

              {result._meta && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {result._meta.is_cached ? (
                    <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>
                        این تحلیل مربوط به {formatMetaDate(result._meta.last_updated)} است.
                      </span>
                    </div>
                  ) : (
                    <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-2">
                      <Zap className="w-3 h-3" />
                      <span>تحلیل لحظه‌ای و جدید</span>
                    </div>
                  )}

                  {typeof result._meta.history_count === "number" && result._meta.history_count > 0 && (
                    <span className="text-slate-400">
                      ({result._meta.history_count} تحلیل آرشیو شده در ۶ ماه گذشته)
                    </span>
                  )}

                  {result._meta.account_flags && result._meta.account_flags.length > 0 && (
                    <span className="text-slate-400">
                      • پرچم‌ها: {result._meta.account_flags.join(", ")}
                    </span>
                  )}
                </div>
              )}

              {/* Top Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Confidence Card */}
                <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-lg flex items-center justify-between relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-16 h-16 bg-emerald-100 rounded-bl-full opacity-50"></div>
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">ضریب اطمینان</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-800">{result.analysis_meta.confidence_score}</span>
                      <span className="text-lg text-emerald-500">%</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <Search className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>

                {/* Focus Card */}
                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg shadow-slate-900/10 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">گرایش غالب</p>
                  <p className="text-xl font-bold truncate dir-ltr text-right">
                    {result.dominant_tendency?.label || formatFocusLabel(result.analysis_meta.primary_focus_area)}
                  </p>
                  {result.dominant_tendency?.explanation && (
                    <p className="text-xs text-slate-400 mt-2 leading-5">
                      {result.dominant_tendency.explanation}
                    </p>
                  )}
                </div>
              </div>

              {/* Main Chart Section */}
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      <Sun className="w-5 h-5 text-orange-400 fill-orange-400" />
                      قطبنمای گفتمانی
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">توزیع معنایی در چهار محور اصلی</p>
                  </div>
                  <span className="px-4 py-1.5 bg-slate-50 text-slate-600 rounded-full text-xs font-bold border border-slate-200">
                    {result.discourse_diversity.rating}
                  </span>
                </div>

                {/* Note: In a real implementation, you'd pass light-mode specific colors to the chart */}
                <div className="h-[350px] w-full dir-ltr bg-slate-50/50 rounded-2xl border border-slate-100 p-4">
                  <DiscourseRadar
                    clusters={result.discourse_clusters}
                    axisScores={result.axis_scores}
                  />
                </div>
              </div>

              {/* Axis Scores Section */}
              {result.axis_scores && (
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <Sun className="w-5 h-5 text-emerald-500 fill-emerald-500" />
                        محورهای چهارگانه رفتاری
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">برداشت رفتاری از ۳۰۰ توییت اخیر و کامنت‌ها</p>
                    </div>
                  </div>
                  <AxisScoresChart scores={result.axis_scores} />
                </div>
              )}

              {/* Clusters List */}
              <div>
                <h3 className="font-bold text-slate-800 mb-5 px-2 flex items-center gap-2">
                  <Quote className="w-5 h-5 text-slate-400" />
                  تحلیل خوشههای فکری
                </h3>
                <div className="grid gap-4">
                  {result.discourse_clusters.map((cluster, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-100 p-6 rounded-3xl transition-all hover:shadow-lg hover:shadow-slate-200/50 hover:border-emerald-200 group"
                    >
                      <div className="flex flex-wrap justify-between items-start mb-3 gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${cluster.mapped_category === 'A' ? 'bg-rose-50 text-rose-600' :
                              cluster.mapped_category === 'B' ? 'bg-blue-50 text-blue-600' :
                                cluster.mapped_category === 'C' ? 'bg-amber-50 text-amber-600' :
                                  'bg-emerald-50 text-emerald-600'
                            }`}>
                            {cluster.mapped_category}
                          </div>
                          <h4 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition-colors">
                            {cluster.cluster_name}
                          </h4>
                        </div>
                        <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase ${cluster.engagement_level === 'High' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                          {cluster.engagement_level} Engagement
                        </span>
                      </div>

                      <p className="text-slate-600 leading-7 text-sm text-justify pl-4 mb-4 opacity-90">
                        {cluster.description}
                      </p>

                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                        {cluster.associated_signals.map((tag, i) => (
                          <span key={i} className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer / Disclaimer */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ⚠️ {result.user_facing_disclaimer} | این تحلیل توسط هوش مصنوعی و بر اساس دادههای عمومی تولید شده است.
                </p>
              </div>

            </div>
          )}
        </div>
      </div>
    </main>
  );
}
