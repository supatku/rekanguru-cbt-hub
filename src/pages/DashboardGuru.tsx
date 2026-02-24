import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Users, TrendingUp, Trophy, Copy, RefreshCw, Download,
  Crown, Medal, Award, Eye, BookOpen, Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

/* ─── Dummy Data ─── */
const chartData = [
  { name: "Qiana\nShanum F.", score: 83 },
  { name: "Reyna\nPraditya P.", score: 80 },
  { name: "Raisa\nAmeera S.", score: 60 },
  { name: "Zaki dan\nzema", score: 43 },
  { name: "Harsya\nYusuf", score: 43 },
];
const barColors = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

const leaderboard = [
  { rank: 1, name: "Qiana Shanum Falihah", score: 83, attempts: 1, duration: "45m" },
  { rank: 2, name: "Reyna Praditya Putri", score: 80, attempts: 1, duration: "48m" },
  { rank: 3, name: "Raisa Ameera Suryadinata", score: 60, attempts: 1, duration: "50m" },
  { rank: 4, name: "Zaki dan zema", score: 43, attempts: 1, duration: "52m" },
  { rank: 5, name: "Harsya Yusuf", score: 43, attempts: 2, duration: "55m" },
];

const topikMatematika = [
  { name: "Sudut", pct: 30 },
  { name: "Waktu dan Kecepatan", pct: 10 },
  { name: "FPB dan KPK", pct: 80 },
  { name: "Perbandingan Harga", pct: 20 },
  { name: "Operasi Bilangan Bulat", pct: 10 },
];
const topikBindo = [
  { name: "Membaca Pemahaman", pct: 65 },
  { name: "Menulis Narasi", pct: 40 },
  { name: "Kosakata", pct: 55 },
  { name: "Tata Bahasa", pct: 30 },
  { name: "Menyimak", pct: 20 },
];

const hasilTerbaru = [
  { name: "Ardi dan Devan", paket: "Paket 1", mapel: "Matematika", skor: 20, benar: 6, total: 30, waktu: "24 Feb, 12.43", durasi: "15m 20s" },
  { name: "Rezvan Naufal Haziq", paket: "Paket 1", mapel: "Matematika", skor: 40, benar: 12, total: 30, waktu: "24 Feb, 12.42", durasi: "22m 10s" },
  { name: "Zaki dan zema", paket: "Paket 1", mapel: "Matematika", skor: 43, benar: 13, total: 30, waktu: "24 Feb, 12.41", durasi: "40m 05s" },
  { name: "Harsya Yusuf", paket: "Paket 1", mapel: "Matematika", skor: 43, benar: 13, total: 30, waktu: "24 Feb, 12.40", durasi: "55m 12s" },
  { name: "Qiana Shanum Falihah", paket: "Paket 1", mapel: "Matematika", skor: 83, benar: 25, total: 30, waktu: "24 Feb, 12.39", durasi: "45m 00s" },
];

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

/* ─── Component ─── */
const DashboardGuru = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[hsl(210,30%,97%)]">
      {/* ══════ HEADER ══════ */}
      <header className="border-b border-border bg-background px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4">
          {/* Left */}
          <button onClick={() => navigate(-1)} className="rounded-lg p-2 transition hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="mr-auto">
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Dashboard Guru</h1>
            <p className="text-sm text-muted-foreground">16 hasil TKA • 0 hasil survei</p>
          </div>

          {/* Right actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border-2 border-sky-500 px-3 py-1.5">
              <span className="text-[10px] font-medium text-muted-foreground leading-none">Kode Kelas</span>
              <span className="text-lg font-extrabold text-sky-600 leading-none">SKS4</span>
            </div>
            <button className="rounded-lg border border-border p-2 transition hover:bg-muted"><Copy className="h-4 w-4" /></button>
            <button className="rounded-lg border border-border p-2 transition hover:bg-muted"><RefreshCw className="h-4 w-4" /></button>
            <button className="rounded-lg border border-border p-2 transition hover:bg-muted"><Download className="h-4 w-4" /></button>
            <button className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold transition hover:bg-muted">Ganti Kelas</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8">
        {/* ══════ TOP METRICS ══════ */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Total Siswa */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 p-5 text-white shadow-lg">
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
              <Users className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium opacity-90">Total Siswa</p>
            <p className="text-3xl font-extrabold">13</p>
          </div>
          {/* Rata-rata */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg">
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
              <TrendingUp className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium opacity-90">Rata-rata Kelas</p>
            <p className="text-3xl font-extrabold">40%</p>
          </div>
          {/* Skor Tertinggi */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white shadow-lg">
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
              <Trophy className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium opacity-90">Skor Tertinggi</p>
            <p className="text-3xl font-extrabold">83%</p>
          </div>
        </div>

        {/* ══════ MIDDLE SECTION ══════ */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Peringkat Siswa */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-amber-500" /> Peringkat Siswa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bar Chart */}
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

              {/* Leaderboard */}
              <div className="divide-y divide-border rounded-xl border border-border">
                {leaderboard.map((s) => (
                  <div key={s.rank} className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/50">
                    <RankIcon rank={s.rank} />
                    <span className="flex-1 text-sm font-semibold truncate">{s.name}</span>
                    <span className={`text-sm font-bold ${scoreColor(s.score)}`}>{s.score}%</span>
                    <span className="text-xs text-muted-foreground">({s.attempts}x)</span>
                    <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0.5">
                      <Clock className="h-3 w-3" /> {s.duration}
                    </Badge>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Analisis Topik */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-sky-500" /> Analisis Topik
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="matematika">
                <TabsList className="w-full">
                  <TabsTrigger value="matematika" className="flex-1">Matematika</TabsTrigger>
                  <TabsTrigger value="bindo" className="flex-1">Bahasa Indonesia</TabsTrigger>
                </TabsList>

                {[
                  { val: "matematika", data: topikMatematika },
                  { val: "bindo", data: topikBindo },
                ].map((tab) => (
                  <TabsContent key={tab.val} value={tab.val} className="mt-4 space-y-4">
                    {/* Legend */}
                    <div className="flex flex-wrap gap-2">
                      {["bg-emerald-500", "bg-amber-500", "bg-red-400", "bg-blue-500", "bg-purple-500"].map((c, i) => (
                        <span key={i} className={`h-3 w-3 rounded-sm ${c}`} />
                      ))}
                    </div>
                    {/* Topics */}
                    {tab.data.map((t) => (
                      <div key={t.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{t.name}</span>
                          <span className="font-bold">{t.pct}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all ${progressColor(t.pct)}`}
                            style={{ width: `${t.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* ══════ BOTTOM: HASIL TERBARU ══════ */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-sky-500" /> Hasil Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="semua">
              <TabsList>
                <TabsTrigger value="semua">Semua (16)</TabsTrigger>
                <TabsTrigger value="mtk">Matematika (16)</TabsTrigger>
                <TabsTrigger value="bindo">B. Indonesia (0)</TabsTrigger>
              </TabsList>

              <TabsContent value="semua" className="mt-4">
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 text-left">
                        <th className="px-4 py-3 font-semibold">Nama</th>
                        <th className="px-4 py-3 font-semibold">Paket</th>
                        <th className="px-4 py-3 font-semibold">Mapel</th>
                        <th className="px-4 py-3 font-semibold">Skor (Akurasi)</th>
                        <th className="px-4 py-3 font-semibold">Waktu Pengerjaan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {hasilTerbaru.map((h, i) => (
                        <tr key={i} className="transition hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{h.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{h.paket}</td>
                          <td className="px-4 py-3 text-muted-foreground">{h.mapel}</td>
                          <td className="px-4 py-3">
                            <span className={`font-bold ${scoreColor(h.skor)}`}>{h.skor}%</span>
                            <span className="ml-1 text-muted-foreground">({h.benar}/{h.total})</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-muted-foreground">{h.waktu}</span>
                            <Badge variant="secondary" className="ml-2 text-[10px] gap-1 px-1.5 py-0.5">
                              <Clock className="h-3 w-3" /> {h.durasi}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              <TabsContent value="mtk" className="mt-4">
                <p className="text-sm text-muted-foreground">Menampilkan data Matematika saja (sama dengan Semua untuk saat ini).</p>
              </TabsContent>
              <TabsContent value="bindo" className="mt-4">
                <p className="text-sm text-muted-foreground">Belum ada data Bahasa Indonesia.</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DashboardGuru;
