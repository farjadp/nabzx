"use client";

import { useState } from "react";
import { Vazirmatn } from "next/font/google";
import { DiscourseRadar } from "@/components/analysis/DiscourseRadar";
import { IdeologyChart } from "@/components/analysis/IdeologyChart";
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
  Clock,
} from "lucide-react";

// فونت وزیرمتن با وزنهای مختلف
const vazir = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazir",
  display: "swap",
});

// --- Components ---

function RecentHistory({ onSelect }: { onSelect: (username: string) => void }) {
  const [recent, setRecent] = useState<{ username: string; last_analyzed_at: string; focus: string }[]>([]);

  useState(() => {
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success" && Array.isArray(data.data)) {
          setRecent(data.data);
        }
      })
      .catch(() => { });
  });

  if (recent.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="text-xs font-bold text-slate-500 mb-3 px-2">تحلیلهای اخیر</p>
      <div className="flex flex-wrap gap-2">
        {recent.map((item, i) => (
          <button
            key={i}
            onClick={() => onSelect(item.username)}
            className="flex items-center gap-2 bg-white/80 border border-slate-200 hover:border-amber-300 hover:shadow-md px-3 py-2 rounded-xl transition-all group"
          >
            <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-700">
              @
            </div>
            <div className="text-right">
              <span className="block text-xs font-bold text-slate-700 group-hover:text-amber-700 dir-ltr">
                {item.username}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

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
      C: "قبیلهگرایی",
      D: "تحمل تعارض",
      Mixed: "ترکیبی",
    };
    return map[normalized] || normalized;
  };

  const handleAnalyze = async (overrideUsername?: string) => {
    const targetUser = overrideUsername || username;
    if (!targetUser.trim()) return;

    if (overrideUsername) setUsername(overrideUsername);

    setLoading(true);
    setStep("scraping");
    setError(null);
    setResult(null);

    try {
      const cleanUsername = targetUser.replace("@", "").trim();
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
      if (!data || !data.dimensions || !data.analysis_meta) {
        throw new Error("پاسخ تحلیل نامعتبر است.");
      }
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطا رخ داد");
    } finally {
      setLoading(false);
      setStep("idle");
    }
  };

  return (
    <main
      className={`min-h-screen bg-[#F6F1E8] text-slate-900 ${vazir.className} selection:bg-amber-200 selection:text-amber-900`}
      dir="rtl"
    >
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#FEF3C7_0%,_transparent_55%)] opacity-70"></div>
        <div className="absolute -top-24 right-[-10%] w-[520px] h-[520px] rounded-full bg-gradient-to-b from-amber-200/60 to-teal-200/40 blur-[140px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[520px] h-[520px] rounded-full bg-gradient-to-b from-sky-200/50 to-amber-100/50 blur-[120px]"></div>
        <div className="absolute left-[-5%] top-24 w-[420px] opacity-20">
          <svg viewBox="0 0 360 220" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g stroke="#B45309" strokeWidth="2" strokeLinecap="round">
              <path d="M20 200 V40" />
              <path d="M70 200 V40" />
              <path d="M120 200 V40" />
              <path d="M170 200 V40" />
              <path d="M220 200 V40" />
              <path d="M270 200 V40" />
            </g>
            <g stroke="#B45309" strokeWidth="3" strokeLinecap="round">
              <path d="M8 40 H292" />
              <path d="M22 25 H278" />
              <path d="M8 200 H292" />
            </g>
          </svg>
        </div>
        <div className="absolute right-[-8%] top-[45%] w-[560px] opacity-10">
          <svg viewBox="0 0 520 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g stroke="#0F766E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="260" cy="90" r="32" />
              <path d="M40 90 C120 40, 200 40, 260 90" />
              <path d="M480 90 C400 40, 320 40, 260 90" />
              <path d="M40 90 C120 140, 200 140, 260 90" />
              <path d="M480 90 C400 140, 320 140, 260 90" />
              <path d="M160 90 H360" />
            </g>
          </svg>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-20">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 text-white flex items-center justify-center">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-2xl lg:text-3xl tracking-tight text-slate-900">
                نـبـض <span className="text-amber-700 font-light">آزادی</span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide">
                سنگ‌نگاره‌ای از افکار عمومی | ۲۰۲۶
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-white/70 px-3 py-1 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              هسته زنده
            </span>
            <a
              href="#analyze"
              className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-semibold hover:border-amber-300 hover:text-amber-700 transition-colors"
            >
              شروع تحلیل
            </a>
            <a
              href="#analysis"
              className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-semibold hover:border-amber-300 hover:text-amber-700 transition-colors"
            >
              نتایج
            </a>
          </div>
        </div>
        <div
          className="h-2 w-full opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(180,83,9,0.35) 25%, transparent 25%, transparent 50%, rgba(180,83,9,0.35) 50%, rgba(180,83,9,0.35) 75%, transparent 75%, transparent)",
            backgroundSize: "18px 18px",
            backgroundColor: "rgba(252,211,77,0.35)",
          }}
        ></div>
      </header>

      {/* Hero */}
      <section className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-start">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/80 border border-amber-200/70 shadow-sm text-amber-900 text-xs font-bold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              موتور تحلیلگر زنده
              <div className="h-4 w-[1px] bg-amber-200 mx-1"></div>
              <span className="text-[10px] text-amber-700 font-medium tracking-wide">V2.1 AI CORE</span>
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl lg:text-6xl font-black text-slate-900 leading-[1.1]">
                خوانش نوینِ <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-700 via-orange-500 to-teal-500">
                  افکار عمومی ایران
                </span>
              </h2>
              <p className="text-slate-600 leading-8 text-lg text-justify">
                دادههای عمومی، بدون قضاوت و با شفافیت کامل تحلیل میشوند تا جایگاه گفتمانی افراد در سپهر ایران امروز دیده شود؛ درست مثل سنگ‌نگاره‌های کهن که روایت خود را برای آیندگان حک میکردند.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-amber-200/60 bg-white/80 p-4 shadow-sm">
                <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-slate-800">حریم خصوصی</p>
                <p className="text-[11px] text-slate-500 mt-1">بدون ذخیرهسازی داده خام</p>
              </div>
              <div className="rounded-2xl border border-amber-200/60 bg-white/80 p-4 shadow-sm">
                <div className="h-9 w-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-3">
                  <Search className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-slate-800">منبع آزاد</p>
                <p className="text-[11px] text-slate-500 mt-1">تحلیل از دادههای عمومی</p>
              </div>
              <div className="rounded-2xl border border-amber-200/60 bg-white/80 p-4 shadow-sm">
                <div className="h-9 w-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-3">
                  <Feather className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-slate-800">بیطرفی</p>
                <p className="text-[11px] text-slate-500 mt-1">گزارش ظرفیتها، نه قضاوتها</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100/70 text-amber-900 text-xs font-semibold border border-amber-200">
                <Quote className="w-4 h-4" />
                آگاهی میراث مشترک ماست
              </div>
              <div className="text-xs text-slate-500">نتیجه در کمتر از ۳۰ ثانیه</div>
            </div>
          </div>

          <div className="relative" id="analyze">
            <div className="absolute -top-4 left-6 hidden lg:flex items-center gap-2 text-xs text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              درگاه تحلیل
            </div>
            <div className="relative bg-white/90 border border-amber-200/70 rounded-[2.5rem] p-8 shadow-[0_40px_80px_-60px_rgba(180,83,9,0.6)] overflow-hidden">
              <div className="absolute inset-x-10 -top-2 h-2 rounded-full bg-gradient-to-r from-amber-300 via-teal-300 to-amber-300 opacity-70"></div>
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-100/40 blur-2xl"></div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <AtSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">ورودی</p>
                    <h3 className="font-bold text-slate-900">شناسه کاربری توییتر/ایکس</h3>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">X / Twitter</span>
              </div>

              <label className="text-sm font-bold text-slate-700 mb-4 block">نام کاربری را وارد کنید</label>

              <div className="relative mb-6">
                <input
                  type="text"
                  dir="ltr"
                  className="block w-full bg-slate-50 border-2 border-slate-100 text-slate-800 rounded-2xl py-4 px-6 text-xl font-mono focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all placeholder:text-slate-300 shadow-inner"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                />
              </div>

              <button
                onClick={() => handleAnalyze()}
                disabled={loading || !username}
                className="w-full py-4 bg-slate-900 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-amber-500/30"
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
                    <span>ترسیم نقشه</span>
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

              <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2">
                  <Fingerprint className="w-4 h-4 text-amber-600" />
                  بدون ذخیرهسازی
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2">
                  <Cpu className="w-4 h-4 text-slate-600" />
                  هوش مصنوعی بیطرف
                </div>
              </div>

              <RecentHistory onSelect={(u) => handleAnalyze(u)} />
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="relative z-10 pb-16" id="analysis">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-amber-700 font-bold">نتایج</p>
              <h3 className="text-2xl font-black text-slate-900">پانل تحلیل گفتمانی</h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full border border-amber-200/70 bg-white/80 px-3 py-1">۵ محور اصلی</span>
              <span className="rounded-full border border-amber-200/70 bg-white/80 px-3 py-1">نقشه احتمالات</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2.75rem] border border-amber-200/70 bg-white/85 shadow-[0_50px_120px_-80px_rgba(180,83,9,0.7)] min-h-[640px]">
            <div
              className="absolute inset-x-0 top-0 h-2"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, rgba(180,83,9,0.35) 25%, transparent 25%, transparent 50%, rgba(180,83,9,0.35) 50%, rgba(180,83,9,0.35) 75%, transparent 75%, transparent)",
                backgroundSize: "18px 18px",
                backgroundColor: "rgba(252,211,77,0.35)",
              }}
            ></div>
            <div className="absolute right-8 top-8 h-24 w-24 rounded-full bg-amber-100/60 blur-2xl"></div>
            <div className="absolute left-8 bottom-8 h-32 w-32 rounded-full bg-teal-100/60 blur-2xl"></div>

            <div className="relative p-8 lg:p-10">
              {!result && !loading ? (
                <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 items-start">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Feather className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">راهنمای خوانش</p>
                        <h4 className="text-xl font-black text-slate-900">پنج ستون گفتمانی</h4>
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm leading-7">
                      این سامانه مثل یک لوح تحلیلی عمل میکند: دادهها را گردآوری کرده، ظرفیتهای گفتار را در پنج محور اصلی میسنجد و نتیجه را به صورت نقشه ارائه میدهد.
                    </p>
                    <div className="rounded-2xl border border-amber-200/60 bg-amber-50/60 p-4 text-xs text-amber-900">
                      نکته: برای نتیجه دقیقتر، حسابهایی با محتوای فعال و عمومی را بررسی کنید.
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {[
                      {
                        title: "اقتدار (Authority)",
                        desc: "تمایل به نظم متمرکز و توجیه سازوکارهای کنترلی.",
                        tone: "bg-rose-50 text-rose-700 border-rose-200",
                        index: "۱",
                      },
                      {
                        title: "آزادی فردی (Liberty)",
                        desc: "اولویت حقوق فردی و آزادی بیان به عنوان خط قرمز.",
                        tone: "bg-sky-50 text-sky-700 border-sky-200",
                        index: "۲",
                      },
                      {
                        title: "قبیلهگرایی (Tribalism)",
                        desc: "شدت مرزبندی ما/آنها و نگاه حذفگرایانه.",
                        tone: "bg-amber-50 text-amber-700 border-amber-200",
                        index: "۳",
                      },
                      {
                        title: "تحمل تعارض (Conflict)",
                        desc: "آمادگی برای مواجهه رادیکال یا مصالحه.",
                        tone: "bg-teal-50 text-teal-700 border-teal-200",
                        index: "۴",
                      },
                      {
                        title: "افق تغییر (Change Horizon)",
                        desc: "باور به اصلاحات تدریجی یا تغییر ساختاری فوری.",
                        tone: "bg-orange-50 text-orange-700 border-orange-200",
                        index: "۵",
                      },
                    ].map((item) => (
                      <div key={item.title} className="flex items-start gap-4 rounded-2xl border border-slate-200/60 bg-white/80 p-4 shadow-sm">
                        <div className={`h-9 w-9 rounded-xl border flex items-center justify-center font-bold ${item.tone}`}>
                          {item.index}
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-slate-800 mb-1">{item.title}</h5>
                          <p className="text-xs text-slate-500 leading-5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {loading && !result && (
                <div className="h-full rounded-[2rem] bg-white/80 p-10 shadow-inner flex flex-col items-center justify-center space-y-8">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-amber-100 border-t-amber-500 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sun className="w-8 h-8 text-amber-500" />
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
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {result._meta?.is_cached ? (
                      <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>این تحلیل مربوط به {formatMetaDate(result._meta.last_updated)} است.</span>
                      </div>
                    ) : (
                      <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-2">
                        <Zap className="w-3 h-3" />
                        <span>تحلیل لحظه‌ای و جدید</span>
                      </div>
                    )}

                    {typeof result._meta?.history_count === "number" && result._meta.history_count > 0 && (
                      <span className="text-slate-400">
                        ({result._meta.history_count} تحلیل آرشیو شده در ۶ ماه گذشته)
                      </span>
                    )}

                    {result._meta?.account_flags && result._meta.account_flags.length > 0 && (
                      <span className="text-slate-400">• پرچمها: {result._meta.account_flags.join(", ")}</span>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-amber-200/60 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">ضریب اطمینان</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-slate-800">
                            {result.analysis_meta?.confidence_score ?? "—"}
                          </span>
                          <span className="text-sm text-amber-600">%</span>
                        </div>
                      </div>
                      <div className="h-11 w-11 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100">
                        <Search className="w-5 h-5 text-amber-600" />
                      </div>
                    </div>

                    <div className="bg-white border border-amber-200/60 p-5 rounded-2xl shadow-sm">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">تمرکز غالب</p>
                      <div className="text-lg font-black text-slate-800">
                        {formatFocusLabel(result.analysis_meta?.primary_focus_area)}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">محور غالب رفتاری</p>
                    </div>

                    <div className="bg-white border border-amber-200/60 p-5 rounded-2xl shadow-sm">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">سیگنالهای پردازش</p>
                      <div className="text-lg font-black text-slate-800">
                        {result.analysis_meta?.total_signals_processed ?? "—"}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">حجم داده موثر</p>
                    </div>
                  </div>

                  <div className="bg-white border border-amber-200/60 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                          <Sun className="w-5 h-5 text-amber-500 fill-amber-400" />
                          قطبنمای گفتمانی
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">توزیع معنایی در پنج محور اصلی</p>
                      </div>
                      <span className="text-[11px] text-slate-400">{result.profile_title}</span>
                    </div>

                    <div className="w-full dir-ltr bg-slate-50/60 rounded-2xl border border-slate-100 p-6">
                      <DiscourseRadar dimensions={result.dimensions} />

                      {result.ideological_analysis && (
                        <div className="mt-8 pt-8 border-t border-slate-200">
                          <h4 className="text-right text-sm font-bold text-slate-800 mb-6 flex items-center justify-end gap-2">
                            <span className="text-slate-400 text-[10px] font-normal">(Probabilistic Map)</span>
                            نقشه گرایشهای ایدئولوژیک
                          </h4>
                          <IdeologyChart data={result.ideological_analysis} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-amber-200/60 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Quote className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">شرح کوتاه</p>
                        <h4 className="text-sm font-bold text-slate-900">
                          اگر قرار باشه این کاربر رو توضیح بدیم اینه که...
                        </h4>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-7 text-justify">
                      {result.persona_summary || result.interpretation}
                    </p>
                    <p className="mt-3 text-[11px] text-slate-400">
                      بر اساس تحلیل توییتها، هشتگها و نمونه پاسخها.
                    </p>
                  </div>

                  <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-center">
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      ⚠️ {result.disclaimer} | این تحلیل توسط هوش مصنوعی و بر اساس دادههای عمومی تولید شده است.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
