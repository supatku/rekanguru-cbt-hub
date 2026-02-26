import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft, BookOpen, Clock, CheckCircle2, AlertCircle,
    TrendingUp, Trophy, History, MousePointer2, ExternalLink,
    ChevronRight, Brain, Target, Star, Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

/* ─── Helpers ─── */
const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

/* ─── Dummy Topic Data ─── */
const TOPIC_DUMMY_DATA: Record<string, { name: string; score: number; total: number }[]> = {
    matematika: [
        { name: "Bilangan Cacah", score: 5, total: 5 },
        { name: "Operasi Hitung", score: 4, total: 5 },
        { name: "Pecahan", score: 3, total: 5 },
        { name: "Geometri Dasar", score: 5, total: 5 },
        { name: "Statistika", score: 4, total: 5 },
    ],
    bahasa_indonesia: [
        { name: "Kosakata Khusus", score: 2, total: 2 },
        { name: "Informasi Tersurat", score: 5, total: 5 },
        { name: "Ide Pokok", score: 1, total: 1 },
        { name: "Langkah-langkah Prosedur", score: 1, total: 1 },
        { name: "Objek dalam Puisi", score: 0, total: 1 },
    ],
};

const DetailSiswa = () => {
    const { jenjang, namaSiswa } = useParams();
    const navigate = useNavigate();
    const [studentResults, setStudentResults] = useState<any[]>([]);
    const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const decodedName = decodeURIComponent(namaSiswa || "");

    useEffect(() => {
        const fetchResults = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from("tka_hasil_ujian")
                    .select("*")
                    .ilike("nama_siswa", decodedName)
                    .order("created_at", { ascending: false });

                if (error) throw error;
                setStudentResults(data || []);
                if (data && data.length > 0) {
                    setSelectedResultId(data[0].id);
                }
            } catch (err: any) {
                toast.error("Gagal memuat data siswa: " + err.message);
            } finally {
                setIsLoading(true); // Artificial delay or just let it finish
                setIsLoading(false);
            }
        };

        if (decodedName) {
            fetchResults();
        }
    }, [decodedName]);

    /* ─── Derived States ─── */
    const selectedResult = useMemo(() => {
        return studentResults.find((r) => r.id === selectedResultId) || null;
    }, [studentResults, selectedResultId]);

    const stats = useMemo(() => {
        if (studentResults.length === 0) return { overall: 0, math: 0, bio: 0 };

        const mathResults = studentResults.filter(r => r.mapel?.toLowerCase().includes("matematika"));
        const bioResults = studentResults.filter(r => r.mapel?.toLowerCase().includes("indonesia"));

        const calcAvg = (arr: any[]) =>
            arr.length > 0 ? Math.round(arr.reduce((acc, curr) => acc + curr.skor_total, 0) / arr.length) : 0;

        return {
            overall: calcAvg(studentResults),
            math: calcAvg(mathResults),
            bio: calcAvg(bioResults)
        };
    }, [studentResults]);

    /* ─── Mapping Topics to Current Result ─── */
    const currentTopics = useMemo(() => {
        if (!selectedResult) return [];
        const mapelLower = selectedResult.mapel?.toLowerCase() || "";
        if (mapelLower.includes("matematika")) return TOPIC_DUMMY_DATA.matematika;
        if (mapelLower.includes("indonesia")) return TOPIC_DUMMY_DATA.bahasa_indonesia;
        return [];
    }, [selectedResult]);

    const strengths = currentTopics.filter(t => (t.score / t.total) >= 0.8);
    const weaknesses = currentTopics.filter(t => (t.score / t.total) < 0.8);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-500 border-t-transparent mx-auto mb-4" />
                    <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Memuat Detail Siswa...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
            {/* ══════ HEADER ══════ */}
            <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur-md px-4 py-6 sm:px-8">
                <div className="mx-auto flex max-w-7xl items-center gap-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all hover:scale-105"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{decodedName}</h1>
                        <p className="flex items-center gap-2 text-sm font-bold text-slate-400">
                            <History className="h-4 w-4" />
                            {studentResults.length} Hasil Ujian Ditemukan
                        </p>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 pt-8 sm:px-8 space-y-8">
                {/* ══════ SUMMARY CARDS ══════ */}
                <div className="grid gap-6 sm:grid-cols-3">
                    {[
                        { label: "Rata-rata Keseluruhan", value: `${stats.overall}%`, icon: <TrendingUp />, color: "bg-blue-600", shadow: "shadow-blue-500/20" },
                        { label: "Rata-rata Matematika", value: `${stats.math}%`, icon: <Brain />, color: "bg-amber-500", shadow: "shadow-amber-500/20" },
                        { label: "Rata-rata B. Indonesia", value: `${stats.bio}%`, icon: <BookOpen />, color: "bg-emerald-500", shadow: "shadow-emerald-500/20" },
                    ].map((card, i) => (
                        <Card key={i} className={`group relative overflow-hidden rounded-[32px] border-none ${card.shadow} transition-all hover:scale-[1.03]`}>
                            <CardContent className="flex items-center gap-6 p-8">
                                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${card.color} text-white shadow-lg`}>
                                    {card.icon}
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{card.label}</p>
                                    <p className="text-4xl font-black text-slate-900">{card.value}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* ══════ MAIN CONTENT (2 COLUMNS) ══════ */}
                <div className="grid gap-8 lg:grid-cols-12">

                    {/* COLUMN LEFT: HISTORY (4/12) */}
                    <div className="lg:col-span-4 space-y-4">
                        <h3 className="flex items-center gap-2 px-2 text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                            <History className="h-4 w-4" /> Riwayat Ujian
                        </h3>
                        <div className="space-y-3">
                            {studentResults.map((res) => (
                                <button
                                    key={res.id}
                                    onClick={() => setSelectedResultId(res.id)}
                                    className={`w-full group relative flex flex-col items-start gap-1 rounded-[24px] border-2 p-5 text-left transition-all ${selectedResultId === res.id
                                        ? "border-sky-500 bg-sky-50/50 shadow-lg shadow-sky-500/10"
                                        : "border-transparent bg-white hover:border-slate-200"
                                        }`}
                                >
                                    <div className="flex w-full items-center justify-between">
                                        <Badge variant="secondary" className={`rounded-lg font-black text-[10px] uppercase tracking-wider ${selectedResultId === res.id ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"
                                            }`}>
                                            Paket {res.paket_ke}
                                        </Badge>
                                        <span className={`text-xl font-black ${res.skor_total >= 70 ? "text-emerald-500" : res.skor_total >= 50 ? "text-amber-500" : "text-red-500"
                                            }`}>
                                            {res.skor_total}%
                                        </span>
                                    </div>
                                    <p className="font-black text-slate-800 uppercase tracking-tight">{res.mapel}</p>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDate(res.created_at)}
                                    </div>
                                    {selectedResultId === res.id && (
                                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-sky-500 flex items-center justify-center text-white shadow-lg">
                                            <ChevronRight className="h-5 w-5" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* COLUMN RIGHT: DETAIL (8/12) */}
                    <div className="lg:col-span-8">
                        {selectedResult ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                {/* Detailed Top Info */}
                                <Card className="rounded-[40px] border-none bg-white p-2 shadow-2xl shadow-slate-200/50 overflow-hidden">
                                    <div className="bg-slate-900 rounded-[36px] p-10 text-white relative overflow-hidden">
                                        {/* Abstract shapes */}
                                        <div className="absolute top-0 right-0 h-64 w-64 bg-sky-500/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
                                        <div className="absolute bottom-0 left-0 h-48 w-48 bg-emerald-500/10 blur-[80px] rounded-full -translate-x-1/4 translate-y-1/4" />

                                        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                                            <div className="space-y-2">
                                                <p className="text-xs font-black uppercase tracking-[0.3em] text-sky-400">DETAIL EVALUASI</p>
                                                <h2 className="text-4xl font-black tracking-tight uppercase">Paket {selectedResult.paket_ke}</h2>
                                                <p className="text-xl font-bold opacity-70">{selectedResult.mapel}</p>
                                            </div>

                                            <div className="flex items-end gap-10">
                                                <div className="text-center">
                                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">SCORE</p>
                                                    <p className="text-6xl font-black text-sky-400 leading-none">{selectedResult.skor_total}<span className="text-2xl opacity-50">%</span></p>
                                                </div>
                                                <div className="pb-2">
                                                    <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                                                        <Target className="h-5 w-5 text-emerald-400" />
                                                        <p className="text-lg font-black">{selectedResult.total_benar}<span className="text-sm font-bold opacity-50 ml-1">/ {selectedResult.total_soal} BENAR</span></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-6 text-sm font-bold opacity-60">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                Waktu: {formatDuration(selectedResult.waktu_pengerjaan)}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Dikerjakan: {formatDate(selectedResult.created_at)}
                                            </div>
                                        </div>
                                    </div>

                                    <CardContent className="p-10 space-y-10">
                                        {/* Strengths & Weaknesses */}
                                        <div className="grid gap-6 md:grid-cols-2">
                                            {/* Strength Block */}
                                            <div className="rounded-[32px] bg-emerald-50 p-8 border border-emerald-100">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                                                        <Star className="h-5 w-5 fill-current" />
                                                    </div>
                                                    <h4 className="text-sm font-black uppercase tracking-widest text-emerald-700">Kekuatan (Topik Dikuasai)</h4>
                                                </div>
                                                <div className="space-y-4">
                                                    {strengths.length > 0 ? strengths.map((t, idx) => (
                                                        <div key={idx} className="flex items-center justify-between text-xs font-bold text-emerald-800">
                                                            <span>{t.name}</span>
                                                            <Badge className="bg-emerald-200 text-emerald-700 pointer-events-none">{t.score}/{t.total}</Badge>
                                                        </div>
                                                    )) : <p className="text-xs font-bold text-emerald-600 opacity-60">Terus berlatih untuk menemukan kekuatanmu!</p>}
                                                </div>
                                            </div>

                                            {/* Weakness Block */}
                                            <div className="rounded-[32px] bg-amber-50 p-8 border border-amber-100">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                                                        <AlertCircle className="h-5 w-5" />
                                                    </div>
                                                    <h4 className="text-sm font-black uppercase tracking-widest text-amber-700">Kelemahan (Perlu Ditingkatkan)</h4>
                                                </div>
                                                <div className="space-y-4">
                                                    {weaknesses.length > 0 ? weaknesses.map((t, idx) => (
                                                        <div key={idx} className="flex items-center justify-between text-xs font-bold text-amber-800">
                                                            <span>{t.name}</span>
                                                            <Badge className="bg-amber-200 text-amber-700 pointer-events-none">{t.score}/{t.total}</Badge>
                                                        </div>
                                                    )) : <p className="text-xs font-bold text-amber-600 opacity-60">Luar biasa! Tidak ada kelemahan yang signifikan.</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* All Topics Progress */}
                                        <div className="space-y-6">
                                            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Analisis Semua Topik</h4>
                                            <div className="grid gap-x-12 gap-y-8 md:grid-cols-2">
                                                {currentTopics.map((topic, i) => {
                                                    const percentage = Math.round((topic.score / topic.total) * 100);
                                                    return (
                                                        <div key={i} className="space-y-3">
                                                            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-tight text-slate-600">
                                                                <div className="flex items-center gap-2">
                                                                    {percentage >= 80 ? (
                                                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                                    ) : (
                                                                        <div className="h-4 w-4 rounded-full border-2 border-slate-200" />
                                                                    )}
                                                                    <span>{topic.name}</span>
                                                                </div>
                                                                <span className={percentage >= 80 ? "text-emerald-600" : "text-slate-400"}>{percentage}%</span>
                                                            </div>
                                                            <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100 p-1">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-1000 ${percentage >= 80 ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]" :
                                                                        percentage >= 50 ? "bg-amber-400" : "bg-red-400"
                                                                        }`}
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <div className="flex h-[400px] flex-col items-center justify-center rounded-[40px] border-2 border-dashed border-slate-200 bg-white/50 text-center p-12">
                                <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                                    <History className="h-10 w-10 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-400">Silakan pilih ujian dari riwayat di sebelah kiri.</h3>
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
};

export default DetailSiswa;
