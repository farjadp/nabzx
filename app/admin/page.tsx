// ============================================================================
// Hardware Source: app/admin/page.tsx
// Version: 1.0.0 — 2026-01-20
// Why: Secure Admin Dashboard for Discourse Analysis Engine
// Env / Identity: Client Component / Vazirmatn
// ============================================================================

"use client";

import { useEffect, useState } from "react";
import { Vazirmatn } from "next/font/google";
import {
    Shield,
    Activity,
    Users,
    Database,
    Trash2,
    RefreshCw,
    Search,
    Eye,
    CheckCircle,
    Zap
} from "lucide-react";

// Font Configuration
const vazir = Vazirmatn({
    subsets: ["arabic", "latin"],
    variable: "--font-vazir",
    display: "swap",
});

interface LogItem {
    username: string;
    last_analyzed_at: string;
    category: string;
    confidence: number;
}

interface AdminStats {
    total_analyzed: number;
    cache_hit_rate: number;
    est_cost_saved: string;
    system_status: string;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    // Fetch Data
    const fetchData = async () => {
        try {
            const res = await fetch("/api/admin");
            const data = await res.json();
            if (data.status === "success") {
                setStats(data.stats);
                setLogs(data.logs);
            }
        } catch (error: unknown) {
            console.error("Failed to load admin data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Polling every 10s
        return () => clearInterval(interval);
    }, []);

    // Handle Delete
    const handleDelete = async (username: string) => {
        if (!confirm(`Are you sure you want to delete records for @${username}?`)) return;
        try {
            await fetch("/api/admin", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete_user", username }),
            });
            fetchData(); // Refresh
        } catch (error: unknown) {
            console.error("Delete failed", error);
            alert("Delete failed");
        }
    };

    // Filter Logs
    const filteredLogs = logs.filter((log) =>
        log.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className={`min-h-screen bg-slate-50 text-slate-800 ${vazir.className} dir-rtl`} dir="rtl">

            {/* Sidebar / Navigation (Vertical Left for Desktop) */}
            <div className="flex h-screen overflow-hidden">

                {/* Sidebar */}
                <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col shadow-2xl z-50">
                    <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-emerald-500 rounded-lg shadow-lg shadow-emerald-500/20">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg tracking-tight">Admin<span className="text-emerald-400">Core</span></h1>
                            <p className="text-[10px] text-slate-400 font-mono">V2.1.0-RC1</p>
                        </div>
                    </div>

                    <nav className="flex-1 p-4 space-y-2">
                        <button className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-600/10 text-emerald-400 border-r-2 border-emerald-500 rounded-lg font-medium transition-all">
                            <Activity className="w-5 h-5" />
                            <span>Dashboard</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-all">
                            <Database className="w-5 h-5" />
                            <span>Data Store</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-all">
                            <Users className="w-5 h-5" />
                            <span>Access Control</span>
                        </button>
                    </nav>

                    <div className="p-4 border-t border-slate-800">
                        <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                            <div className={`w-2 h-2 rounded-full ${stats?.system_status === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-xs font-mono text-slate-300">
                                System: {stats?.system_status || 'Checking...'}
                            </span>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-y-auto">
                    {/* Top Bar */}
                    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
                        <h2 className="font-bold text-slate-700 text-xl flex items-center gap-2">
                            <Zap className="w-5 h-5 text-emerald-500" />
                            Overview
                        </h2>
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-slate-400 font-mono bg-slate-100 px-3 py-1 rounded-full">{new Date().toLocaleDateString('fa-IR')}</span>
                            <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-500 text-xs">AD</div>
                        </div>
                    </header>

                    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">

                        {/* Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                            {/* Stat 1 */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Users className="w-16 h-16 text-emerald-600" />
                                </div>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Analyzed</p>
                                <h3 className="text-4xl font-black text-slate-800 mt-2">{stats?.total_analyzed || 0}</h3>
                                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-full">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Verified Users</span>
                                </div>
                            </div>

                            {/* Stat 2 */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Cache Hit Rate</p>
                                <h3 className="text-4xl font-black text-slate-800 mt-2">{stats?.cache_hit_rate || 0}<span className="text-lg text-slate-400">%</span></h3>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[87%]"></div>
                                </div>
                            </div>

                            {/* Stat 3 */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Est. Cost Saved</p>
                                <h3 className="text-4xl font-black text-slate-800 mt-2">${stats?.est_cost_saved || 0}</h3>
                                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 w-fit px-2 py-1 rounded-full">
                                    <Database className="w-3 h-3" />
                                    <span>Optimized Queries</span>
                                </div>
                            </div>

                            {/* Stat 4 */}
                            <div className={`p-6 rounded-2xl border shadow-sm relative overflow-hidden group hover:shadow-md transition-all ${maintenanceMode ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                <p className={`${maintenanceMode ? 'text-rose-600' : 'text-emerald-700'} text-xs font-bold uppercase tracking-wider`}>API Engine</p>
                                <h3 className={`text-2xl font-black mt-2 ${maintenanceMode ? 'text-rose-700' : 'text-emerald-800'}`}>
                                    {maintenanceMode ? 'MAINTENANCE' : 'OPERATIONAL'}
                                </h3>
                                <div className="mt-4 flex items-center gap-2">
                                    <span className={`relative flex h-3 w-3`}>
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${maintenanceMode ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                                        <span className={`relative inline-flex rounded-full h-3 w-3 ${maintenanceMode ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                                    </span>
                                    <span className="text-xs font-bold opacity-70">Real-time</span>
                                </div>
                            </div>

                        </div>

                        {/* Controls & Search */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search Logs..."
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl py-3 pr-12 pl-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                                    className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${maintenanceMode ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <Activity className="w-4 h-4" />
                                    {maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'}
                                </button>
                                <button
                                    onClick={fetchData}
                                    className="px-4 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/20"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Refresh
                                </button>
                            </div>
                        </div>

                        {/* Main Table */}
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead className="bg-slate-50/80 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Analysis Date</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Confidence</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 animate-pulse">
                                                    Loading logs...
                                                </td>
                                            </tr>
                                        ) : filteredLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                                    No records found.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredLogs.map((log) => (
                                                <tr key={log.username} className="group hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500">@</div>
                                                            <span className="font-bold text-slate-700 dir-ltr text-right block">{log.username}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-500">
                                                        {new Date(log.last_analyzed_at).toLocaleDateString('fa-IR')}
                                                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                                                            {new Date(log.last_analyzed_at).toLocaleTimeString('fa-IR')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                ${log.category === 'A' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                                log.category === 'B' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                    log.category === 'C' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                        'bg-emerald-50 text-emerald-700 border-emerald-200'}
                              `}>
                                                            {log.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-emerald-500" style={{ width: `${log.confidence}%` }}></div>
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-600">{log.confidence}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(log.username)}
                                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete Record"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 bg-slate-50/50 border-t border-slate-200 text-xs text-slate-400 flex justify-between items-center">
                                <span>Showing {filteredLogs.length} entries</span>
                                <div className="flex gap-1">
                                    <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">Previous</button>
                                    <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Next</button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </main>
    );
}
