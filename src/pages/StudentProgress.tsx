import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Trash2,
    BookOpen,
    TrendingUp,
    Trophy,
    History,
    Calendar,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ExamProgress {
    paket: string;
    mapel: string;
    skor: number;
    total_benar: number;
    total_soal: number;
    tanggal: number;
}

const StudentProgress = () => {
    const navigate = useNavigate();
    const [progress, setProgress] = useState<ExamProgress[]>([]);

    useEffect(() => {
        const data = localStorage.getItem("cbt_student_progress");
        if (data) {
            setProgress(JSON.parse(data));
        }
    }, []);

    const handleClearHistory = () => {
        if (window.confirm("Apakah Anda yakin ingin menghapus semua riwayat latihan?")) {
            localStorage.removeItem("cbt_student_progress");
            setProgress([]);
        }
    };

    const formatDate = (timestamp: number) => {
        return new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }).format(new Date(timestamp));
    };

    const stats = {
        total: progress.length,
        average: progress.length > 0
            ? Math.round(progress.reduce((acc, curr) => acc + curr.skor, 0) / progress.length)
            : 0,
        highest: progress.length > 0
            ? Math.max(...progress.map(p => p.skor))
            : 0
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            {/* ══════ HEADER ══════ */}
            <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-white px-4 py-4 shadow-sm sm:px-8">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/dashboard")}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Kembali</span>
                    </Button>
                    <h1 className="text-lg font-bold text-slate-900 sm:text-xl">Progres Latihan Saya</h1>
                </div>

                <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleClearHistory}
                    disabled={progress.length === 0}
                    className="flex items-center gap-2"
                >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Hapus Riwayat</span>
                </Button>
            </header>

            <main className="container mx-auto mt-8 max-w-5xl px-4">
                {progress.length === 0 ? (
                    /* ── EMPTY STATE ── */
                    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white py-20 text-center shadow-sm">
                        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
                            <History className="h-12 w-12 text-slate-400" />
                        </div>
                        <h2 className="mb-2 text-2xl font-bold text-slate-800">Riwayat Masih Kosong</h2>
                        <p className="mb-8 max-w-xs text-slate-500">
                            Belum ada data latihan. Yuk, mulai kerjakan paket soal dan lihat progresmu di sini!
                        </p>
                        <Button onClick={() => navigate("/dashboard")} className="rounded-full px-8">
                            Mulai Latihan
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* ── STAT CARDS ── */}
                        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <Card className="border-none shadow-sm transition-transform hover:scale-[1.02]">
                                <CardContent className="flex items-center gap-4 p-6">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                                        <BookOpen className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Total Latihan</p>
                                        <p className="text-2xl font-bold text-slate-900">{stats.total} Paket</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm transition-transform hover:scale-[1.02]">
                                <CardContent className="flex items-center gap-4 p-6">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                                        <TrendingUp className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Rata-rata Skor</p>
                                        <p className="text-2xl font-bold text-slate-900">{stats.average}%</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm transition-transform hover:scale-[1.02]">
                                <CardContent className="flex items-center gap-4 p-6">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                                        <Trophy className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Nilai Tertinggi</p>
                                        <p className="text-2xl font-bold text-slate-900">{stats.highest}%</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* ── HISTORY LIST ── */}
                        <Card className="border-none shadow-sm">
                            <CardHeader className="flex flex-row items-center gap-3 border-b border-slate-50 pb-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                                    <History className="h-4 w-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Riwayat Pengerjaan Terbaru</CardTitle>
                                    <CardDescription>Menampilkan semua latihan yang telah diselesaikan</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100">
                                    {progress.map((item, index) => (
                                        <div
                                            key={index}
                                            className="group flex flex-col gap-4 p-5 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-hover:bg-white">
                                                    <CheckCircle2 className={`h-5 w-5 ${item.skor >= 75 ? "text-emerald-500" : "text-amber-500"}`} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">Paket {item.paket} - {item.mapel}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Calendar className="h-3 w-3 text-slate-400" />
                                                        <span className="text-xs text-slate-500">{formatDate(item.tanggal)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-6 sm:justify-end">
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-slate-500">Skor Akhir</p>
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <span className={`text-xl font-black ${item.skor >= 75 ? "text-emerald-600" : "text-amber-600"}`}>
                                                            {item.skor}%
                                                        </span>
                                                        <Badge variant="outline" className="text-[10px] font-bold">
                                                            {item.total_benar}/{item.total_soal} Benar
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </main>
        </div>
    );
};

export default StudentProgress;
