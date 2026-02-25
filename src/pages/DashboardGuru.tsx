import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Users, TrendingUp, Trophy, Copy, RefreshCw, Download,
  Crown, Medal, Award, Eye, BookOpen, Clock, Loader2, Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

/* ─── Helpers ─── */
const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Crown className="h-5 w-5 text-amber-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
  if (rank === 3) return <Award className="h-5 w-5 text-amber-700" />;
  return <span className="flex h-5 w-5 items-center justify-center text-xs font-bold text-muted-foreground">{rank}</span>;
};

const scoreColor = (s: number) => (s >= 70 ? "text-emerald-600" : s >= 50 ? "text-amber-600" : "text-red-500");

const progressColor = (p: number) =>
  p >= 70 ? "bg-emerald-500" : p >= 40 ? "bg-amber-500" : "bg-red-400";

const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
};

/* ─── Component ─── */
const DashboardGuru = () => {
  const navigate = useNavigate();
  const [kodeInput, setKodeInput] = useState("");
  const [currentClass, setCurrentClass] = useState("");
  const [kelasData, setKelasData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchKelasData = async (inputKode: string) => {
    const cleanKode = inputKode.trim().toUpperCase();
    if (!cleanKode) {
      toast.error("Masukkan kode kelas terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    console.log('--- Fetching data untuk kode:', cleanKode);

    try {
      const { data, error } = await supabase
        .from('tka_hasil_ujian')
        .select('*')
        .eq('kode_kelas', cleanKode)
        .order('skor_total', { ascending: false });

      console.log('--- Hasil fetch:', { data, error });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.info(`Belum ada data ujian untuk kode kelas: ${cleanKode}`);
        setKelasData([]);
        setCurrentClass(cleanKode);
      } else {
        setKelasData(data);
        setCurrentClass(cleanKode);
        localStorage.setItem("last_fetched_kode", cleanKode);
        toast.success(`Data kelas ${cleanKode} berhasil ditarik!`);
      }
    } catch (error: any) {
      console.error('--- Error fetch:', error);
      toast.error("Gagal menarik data: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedKode = localStorage.getItem("last_fetched_kode");
    if (savedKode) {
      setKodeInput(savedKode);
      fetchKelasData(savedKode);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKelasData(kodeInput);
  };

  const exportToCSV = () => {
    if (!rankedStudents || rankedStudents.length === 0) {
      toast.error("Tidak ada data untuk diekspor.");
      return;
    }

    const headers = [
      "Peringkat",
      "Nama Siswa",
      "Mata Pelajaran",
      "Paket",
      "Skor (%)",
      "Total Benar",
      "Total Soal",
      "Waktu Pengerjaan",
    ];

    const rows = rankedStudents.map((s, idx) => [
      idx + 1,
      s.nama_siswa,
      s.mapel,
      `Paket ${s.paket_ke}`,
      s.skor_total,
      s.total_benar,
      s.total_soal,
      formatDuration(s.waktu_pengerjaan),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Hasil_Ujian_${currentClass || "Kelas"}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("File CSV berhasil diunduh!");
  };

  /* ─── Derived States ─── */
  const metrics = useMemo(() => {
    if (!kelasData || kelasData.length === 0) return { avg: 0, high: 0, total: 0 };
    const total = kelasData.length;
    const sum = kelasData.reduce((acc, curr) => acc + (curr.skor_total || 0), 0);
    const high = Math.max(...kelasData.map(d => d.skor_total || 0));
    return { avg: Math.round(sum / total), high, total };
  }, [kelasData]);

  const rankedStudents = useMemo(() => {
    if (!kelasData || kelasData.length === 0) return [];
    // Tie-breaker: skor_total DESC, then waktu_pengerjaan ASC
    return [...kelasData].sort((a, b) => {
      if (b.skor_total !== a.skor_total) return b.skor_total - a.skor_total;
      return a.waktu_pengerjaan - b.waktu_pengerjaan;
    });
  }, [kelasData]);

  const chartData = useMemo(() => {
    if (!rankedStudents || rankedStudents.length === 0) return [];
    return rankedStudents.slice(0, 5).map(s => ({
      name: s.nama_siswa?.split(" ").slice(0, 2).join("\n") || "Siswa",
      score: s.skor_total || 0
    }));
  }, [rankedStudents]);

  const barColors = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

  return (
    <div className="min-h-screen bg-[hsl(210,30%,97%)]">
      {/* ══════ HEADER ══════ */}
      <header className="sticky top-0 z-30 border-b border-border bg-background px-4 py-4 sm:px-8 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4">
          <button onClick={() => navigate(-1)} className="rounded-lg p-2 transition hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="mr-auto text-left">
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Dashboard Guru</h1>
            <p className="text-sm text-muted-foreground">
              {currentClass ? `Kelas ${currentClass}` : "Pilih kelas untuk melihat hasil"} • {kelasData.length} Hasil
            </p>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Kode Kelas..."
                value={kodeInput}
                onChange={(e) => setKodeInput(e.target.value)}
                className="w-[140px] pl-9 font-bold uppercase"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="bg-sky-600 font-bold hover:bg-sky-700">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tarik Data"}
            </Button>

            {kelasData.length > 0 && (
              <Button
                type="button"
                onClick={exportToCSV}
                variant="outline"
                className="border-emerald-500 text-emerald-600 font-bold hover:bg-emerald-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            )}
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8">
        {/* ══════ TOP METRICS ══════ */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 p-5 text-white shadow-lg">
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
              <Users className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium opacity-90 text-left">Total Siswa</p>
            <p className="text-3xl font-extrabold text-left">{metrics.total}</p>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg">
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
              <TrendingUp className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium opacity-90 text-left">Rata-rata Kelas</p>
            <p className="text-3xl font-extrabold text-left">{metrics.avg}%</p>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white shadow-lg">
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
              <Trophy className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium opacity-90 text-left">Skor Tertinggi</p>
            <p className="text-3xl font-extrabold text-left">{metrics.high}%</p>
          </div>
        </div>

        {/* ══════ MIDDLE SECTION ══════ */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Peringkat Siswa */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-amber-500" /> Peringkat Siswa (Top 5)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {kelasData.length > 0 ? (
                <>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => `${v}%`} />
                        <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={20}>
                          {chartData.map((_, i) => (
                            <Cell key={i} fill={barColors[i % barColors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="divide-y divide-border rounded-xl border border-border">
                    {rankedStudents.slice(0, 10).map((s, idx) => (
                      <div key={s.id} className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/50">
                        <RankIcon rank={idx + 1} />
                        <span className="flex-1 text-sm font-semibold truncate text-left">{s.nama_siswa}</span>
                        <span className={`text-sm font-bold ${scoreColor(s.skor_total)}`}>{s.skor_total}%</span>
                        <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0.5">
                          <Clock className="h-3 w-3" /> {formatDuration(s.waktu_pengerjaan)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
                  <Search className="h-10 w-10 opacity-20 mb-2" />
                  <p className="font-medium">Belum ada data untuk kode kelas ini.</p>
                  <p className="text-xs opacity-70">Silakan tarik data menggunakan kode kelas yang benar.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hasil Terbaru */}
          <Card>
            <CardHeader className="pb-2 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-sky-500" /> Hasil Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left">
                      <th className="px-4 py-3 font-semibold text-left">Nama</th>
                      <th className="px-4 py-3 font-semibold text-left">Mapel & Paket</th>
                      <th className="px-4 py-3 font-semibold text-left">Skor</th>
                      <th className="px-4 py-3 font-semibold text-left">Durasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {kelasData.length > 0 ? (
                      kelasData.slice(0, 8).map((h) => (
                        <tr key={h.id} className="transition hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium text-left">{h.nama_siswa}</td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-left">
                            {h.mapel} (P{h.paket_ke})
                          </td>
                          <td className="px-4 py-3 text-left">
                            <span className={`font-bold ${scoreColor(h.skor_total)}`}>{h.skor_total}%</span>
                            <span className="ml-1 text-[10px] text-muted-foreground">({h.total_benar}/{h.total_soal})</span>
                          </td>
                          <td className="px-4 py-3 text-left">
                            <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0.5">
                              <Clock className="h-3 w-3" /> {formatDuration(h.waktu_pengerjaan)}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="h-32 text-center text-muted-foreground">
                          {currentClass ? `Belum ada data untuk kelas ${currentClass}` : "Masukkan kode kelas di header..."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DashboardGuru;
