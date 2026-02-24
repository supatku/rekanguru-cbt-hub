import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Loader2,
  AlertTriangle,
  User,
  Hash,
  CheckCircle2,
  XCircle,
  PlayCircle,
  BookOpen as BookIcon,
  Home,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  LayoutPanelLeft,
  Info,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";

interface QuestionOption {
  key: string;
  label: string;
}

interface Question {
  id: string;
  jenjang: string;
  mapel: string;
  paket_ke: number;
  tipe_soal: string;
  teks_soal: string;
  link_gambar: string;
  opsi_jawaban: QuestionOption[];
  kunci_jawaban: string;
  topik: string;
}

const INITIAL_SECONDS = 3600; // 60 mins

const ExamInterface = () => {
  const navigate = useNavigate();
  const { level, paket, mapel } = useParams<{ level: string; paket: string; mapel: string }>();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[] | Record<string, string>>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [seconds, setSeconds] = useState(INITIAL_SECONDS);

  // Submit state
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [namaSiswa, setNamaSiswa] = useState("");
  const [kodeKelas, setKodeKelas] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Results View State
  const [showResults, setShowResults] = useState(false);
  const [finalResult, setFinalResult] = useState<{
    score: number;
    correct: number;
    wrong: number;
    total: number;
    analysis: Record<string, number[]>; // Topic -> Question Numbers
  } | null>(null);

  const mapelLabel = useMemo(() => {
    if (mapel === "matematika") return "Matematika";
    if (mapel === "bahasa-indonesia") return "Bahasa Indonesia";
    return mapel;
  }, [mapel]);

  useEffect(() => {
    fetchQuestions();
  }, [level, paket, mapelLabel]);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const paketNumber = parseInt(paket || '1', 10);
      const levelUpper = level?.toUpperCase() || "";
      const mapelValue = mapelLabel || "";

      const { data, error } = await supabase
        .from('tka_bank_soal')
        .select('*')
        .eq('jenjang', levelUpper)
        .eq('paket_ke', isNaN(paketNumber) ? 1 : paketNumber)
        .eq('mapel', mapelValue);

      if (error) throw error;
      setQuestions(data || []);
    } catch (error: any) {
      console.error('Error fetching questions:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const TOTAL_QUESTIONS = questions.length;
  const question = questions[currentIndex];

  /* ── Timer ── */
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  /* ── Handlers ── */
  const handleAnswer = useCallback(
    (qIndex: number, val: string) => {
      const q = questions[qIndex];
      const isComplex = q?.tipe_soal === "PG_KOMPLEKS";

      setAnswers((prev) => {
        const currentAnswer = prev[qIndex];

        if (q?.tipe_soal === "BENAR_SALAH") {
          const [key, bOrS] = val.split(":");
          const currentMap = (typeof currentAnswer === "object" && !Array.isArray(currentAnswer))
            ? { ...currentAnswer }
            : {} as Record<string, string>;

          currentMap[key] = bOrS;
          return { ...prev, [qIndex]: currentMap };
        } else if (isComplex) {
          const currentArr = Array.isArray(currentAnswer) ? currentAnswer : [];
          if (currentArr.includes(val)) {
            const nextArr = currentArr.filter(v => v !== val);
            return { ...prev, [qIndex]: nextArr.length > 0 ? nextArr : [] };
          } else {
            return { ...prev, [qIndex]: [...currentArr, val] };
          }
        } else {
          return { ...prev, [qIndex]: val };
        }
      });
    },
    [questions],
  );

  const toggleFlag = useCallback(
    () =>
      setFlagged((prev) => {
        const next = new Set(prev);
        next.has(currentIndex) ? next.delete(currentIndex) : next.add(currentIndex);
        return next;
      }),
    [currentIndex],
  );

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(TOTAL_QUESTIONS - 1, i + 1));
  }, [TOTAL_QUESTIONS]);

  const handleSubmit = useCallback(() => {
    setIsSubmitDialogOpen(true);
  }, []);

  const handleFinalSubmit = async () => {
    if (!namaSiswa.trim() || !kodeKelas.trim()) {
      toast.error("Nama dan Kode Kelas wajib diisi!");
      return;
    }

    setIsSubmitting(true);

    try {
      let correctCount = 0;
      const incorrectByTopic: Record<string, number[]> = {};

      questions.forEach((q, idx) => {
        const studentAns = answers[idx];
        const correctAns = q.kunci_jawaban || "";
        let isCorrect = false;

        if (q.tipe_soal === "BENAR_SALAH") {
          const studentMap = (typeof studentAns === "object" && !Array.isArray(studentAns)) ? studentAns as Record<string, string> : {};
          const correctParts = correctAns.split(",").map(v => v.trim());
          let allCorrect = correctParts.length > 0;
          correctParts.forEach(part => {
            const [key, val] = part.split(":");
            if (studentMap[key] !== val) allCorrect = false;
          });
          isCorrect = allCorrect;
        } else if (q.tipe_soal === "PG_KOMPLEKS") {
          const studentArr = Array.isArray(studentAns) ? [...studentAns].sort() : [];
          const correctArr = correctAns.split(",").map(v => v.trim()).sort();
          isCorrect = studentArr.length > 0 && studentArr.join(",") === correctArr.join(",");
        } else {
          isCorrect = studentAns === correctAns;
        }

        if (isCorrect) {
          correctCount++;
        } else {
          const topic = q.topik || "Materi Umum";
          if (!incorrectByTopic[topic]) incorrectByTopic[topic] = [];
          incorrectByTopic[topic].push(idx + 1);
        }
      });

      const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
      const waktuPengerjaan = INITIAL_SECONDS - seconds;
      const paketNumber = parseInt(paket || '1', 10);

      const { error } = await supabase
        .from('tka_hasil_ujian')
        .insert([{
          kode_kelas: kodeKelas.toUpperCase(),
          nama_siswa: namaSiswa,
          jenjang: level?.toUpperCase(),
          paket_ke: isNaN(paketNumber) ? 1 : paketNumber,
          mapel: mapelLabel,
          skor_total: Number(score),
          waktu_pengerjaan: Number(waktuPengerjaan),
          total_benar: Number(correctCount),
          total_soal: Number(questions.length)
        }]);

      if (error) throw error;

      setFinalResult({
        score,
        correct: correctCount,
        wrong: questions.length - correctCount,
        total: questions.length,
        analysis: incorrectByTopic
      });
      setShowResults(true);
      toast.success("Ujian berhasil dikirim! Tetap semangat.");
    } catch (error: any) {
      console.error('Error submitting exam:', error.message);
      toast.error("Gagal mengirim ujian. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
      setIsSubmitDialogOpen(false);
    }
  };

  const answeredCount = useMemo(() => {
    return Object.entries(answers).filter(([idx, a]) => {
      const q = questions[parseInt(idx)];
      if (!q) return false;
      if (q.tipe_soal === "BENAR_SALAH") {
        const studentMap = (typeof a === "object" && !Array.isArray(a)) ? a as Record<string, string> : {};
        return q.opsi_jawaban?.length > 0 && Object.keys(studentMap).length === q.opsi_jawaban.length;
      }
      if (Array.isArray(a)) return a.length > 0;
      return a !== undefined && a !== "";
    }).length;
  }, [answers, questions]);

  const flaggedCount = flagged.size;
  const unansweredCount = TOTAL_QUESTIONS - answeredCount;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-sky-50 p-4">
        <div className="relative mb-6">
          <div className="h-24 w-24 animate-spin rounded-full border-b-4 border-sky-500" />
          <Loader2 className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 animate-pulse text-sky-400" />
        </div>
        <h2 className="text-xl font-black italic tracking-tight text-slate-900 text-center">Menarik Data Rahasia...</h2>
        <p className="mt-2 text-sm font-medium text-slate-500 text-center">Tunggu sebentar ya!</p>
      </div>
    );
  }

  if (showResults && finalResult) {
    const accuracy = Math.round((finalResult.correct / finalResult.total) * 100);
    const performanceLabel = accuracy >= 80 ? "Hebat!" : accuracy >= 60 ? "Bagus!" : "Perlu Belajar Lagi";
    const performanceColor = accuracy >= 80 ? "text-emerald-500" : accuracy >= 60 ? "text-amber-500" : "text-rose-500";
    const gradeLetter = accuracy >= 80 ? "A" : accuracy >= 60 ? "B" : accuracy >= 40 ? "C" : "E";

    return (
      <div className="min-h-screen bg-slate-50 pb-20 pt-10 px-4 md:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-400 text-white shadow-lg shadow-amber-200">
              <Trophy className="h-10 w-10" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight text-center">Hasil Ujian</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm text-center">Paket {paket} - {mapelLabel}</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-2 space-y-6">
              <div className="overflow-hidden rounded-[32px] bg-white border-none shadow-xl">
                <div className="p-8 text-center space-y-6">
                  <div className="space-y-1">
                    <span className={`text-7xl font-black ${performanceColor}`}>{gradeLetter}</span>
                    <p className="font-bold text-slate-400 uppercase tracking-widest text-xs text-center">{performanceLabel}</p>
                  </div>

                  <div className="relative mx-auto flex h-48 w-48 items-center justify-center">
                    <svg className="h-full w-full -rotate-90 transform">
                      <circle cx="96" cy="96" r="88" className="stroke-slate-100" strokeWidth="12" fill="transparent" />
                      <circle cx="96" cy="96" r="88" className={`transition-all duration-1000 ${performanceColor} stroke-current`} strokeWidth="12" fill="transparent" strokeDasharray={2 * Math.PI * 88} strokeDashoffset={2 * Math.PI * 88 * (1 - accuracy / 100)} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-black text-slate-800">{accuracy}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-4">
                    <div className="rounded-2xl bg-emerald-50 p-4">
                      <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500 mb-1" />
                      <p className="text-2xl font-black text-emerald-700">{finalResult.correct}</p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase text-center">Benar</p>
                    </div>
                    <div className="rounded-2xl bg-rose-50 p-4">
                      <XCircle className="mx-auto h-5 w-5 text-rose-500 mb-1" />
                      <p className="text-2xl font-black text-rose-700">{finalResult.wrong}</p>
                      <p className="text-[10px] font-bold text-rose-600 uppercase text-center">Salah</p>
                    </div>
                    <div className="rounded-2xl bg-sky-50 p-4">
                      <LayoutPanelLeft className="mx-auto h-5 w-5 text-sky-500 mb-1" />
                      <p className="text-2xl font-black text-sky-700">{finalResult.total}</p>
                      <p className="text-[10px] font-bold text-sky-600 uppercase text-center">Total</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] bg-sky-500 text-white shadow-lg">
                <div className="flex items-center gap-4 p-6 text-left">
                  <div className="rounded-full bg-white/20 p-3"><Clock className="h-6 w-6" /></div>
                  <div>
                    <p className="text-xs font-bold uppercase opacity-80">Waktu Pengerjaan</p>
                    <p className="text-xl font-black">{Math.floor((INITIAL_SECONDS - seconds) / 60)} menit {(INITIAL_SECONDS - seconds) % 60} detik</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500 border border-amber-200"><AlertTriangle className="h-6 w-6" /></div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight text-left">Analisis & Rekomendasi</h3>
              </div>
              <div className="space-y-4">
                {Object.entries(finalResult.analysis).length > 0 ? (
                  Object.entries(finalResult.analysis).map(([topic, qNums]) => (
                    <div key={topic} className="overflow-hidden rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm text-left">
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-black text-slate-800">{topic}</h4>
                          <p className="text-xs font-bold text-slate-400">Kamu belum tepat di materi ini (Soal No: {qNums.join(", ")})</p>
                        </div>
                        <Badge variant="secondary" className="bg-rose-100 text-rose-600 border-none font-black px-3">{qNums.length} Soal</Badge>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <a href={`https://www.youtube.com/results?search_query=materi+${mapelLabel}+SD+${topic}`} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-600"><PlayCircle className="h-5 w-5" /> Video</a>
                        <a href={`https://www.google.com/search?q=materi+${mapelLabel}+SD+${topic}`} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-50 px-4 py-3 text-sm font-black text-sky-600"><BookIcon className="h-5 w-5" /> Bacaan</a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-[32px] bg-emerald-50 p-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200"><CheckCircle2 className="h-8 w-8" /></div>
                    <h4 className="text-xl font-black text-emerald-800 text-center">Sempurna!</h4>
                    <p className="text-emerald-600 font-bold text-center">Kamu Hebat! Semua materi sudah dikuasai.</p>
                  </div>
                )}
              </div>
              <Button onClick={() => navigate("/")} className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black text-lg shadow-xl"><Home className="mr-3 h-6 w-6" /> Kembali ke Beranda</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-subtle">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-primary px-3 py-2 text-primary-foreground sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={() => navigate(`/mapel/${level}/${paket}`)} className="flex items-center gap-1 text-sm font-medium opacity-80 transition hover:opacity-100">
            <ChevronLeft className="h-4 w-4" /><span className="hidden md:inline">Kembali</span>
          </button>
          <div className="hidden h-6 w-px bg-primary-foreground/30 sm:block" />
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent sm:h-8 sm:w-8">
              <LayoutPanelLeft className="h-4 w-4 text-accent-foreground" />
            </div>
            <div className="leading-tight">
              <p className="text-xs font-bold sm:text-sm text-left">Paket {paket} – {mapelLabel}</p>
              <p className="hidden text-[10px] opacity-70 sm:block text-left text-primary-foreground/70">Tes Kemampuan Akademik</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 rounded-full bg-primary-foreground/10 px-2 py-1 sm:px-3 sm:py-1.5">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="font-mono text-xs font-bold sm:text-sm">{formatTime(seconds)}</span>
          </div>
          <Button size="sm" onClick={handleSubmit} className="h-8 rounded-full bg-accent px-3 text-[10px] font-bold text-accent-foreground sm:h-9 sm:px-4 sm:text-xs">
            Selesai Ujian
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <main className="flex-1 p-4 sm:p-6 lg:w-[70%]">
          {!question ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-rose-200 bg-white">
              <AlertTriangle className="h-12 w-12 text-rose-300" />
              <p className="mt-4 font-bold text-slate-800">Soal tidak ditemukan.</p>
              <Button onClick={() => navigate("/")} className="mt-4">Ke Beranda</Button>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-background p-5 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5 text-orange-600">
                  <span className="text-sm font-black">Soal {currentIndex + 1}</span>
                </div>
                <Button variant="outline" size="sm" onClick={toggleFlag} className={`rounded-lg ${flagged.has(currentIndex) ? "bg-amber-100 text-amber-700 border-amber-200" : ""}`}>
                  <Flag className={`h-4 w-4 ${flagged.has(currentIndex) ? "fill-current" : ""}`} /> Tandai
                </Button>
              </div>

              {question.link_gambar && <img src={question.link_gambar} className="mb-6 max-h-72 mx-auto rounded-2xl" />}
              <p className="text-sm font-bold text-slate-900 sm:text-lg text-justify whitespace-pre-line mb-8">{question.teks_soal}</p>

              <div className="grid gap-4">
                {question.tipe_soal === "BENAR_SALAH" ? (
                  question.opsi_jawaban?.map((opt) => {
                    const sMap = (typeof answers[currentIndex] === "object" && !Array.isArray(answers[currentIndex])) ? answers[currentIndex] as Record<string, string> : {};
                    return (
                      <div key={opt.key} className="rounded-2xl border p-4 bg-white shadow-sm">
                        <p className="mb-3 font-bold text-slate-700 text-left">{opt.label}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <Button onClick={() => handleAnswer(currentIndex, `${opt.key}:B`)} className={`rounded-xl h-12 ${sMap[opt.key] === "B" ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-400"}`}>Benar</Button>
                          <Button onClick={() => handleAnswer(currentIndex, `${opt.key}:S`)} className={`rounded-xl h-12 ${sMap[opt.key] === "S" ? "bg-rose-500 text-white" : "bg-slate-50 text-slate-400"}`}>Salah</Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  question.opsi_jawaban?.map((opt) => {
                    const isComplex = question.tipe_soal === "PG_KOMPLEKS";
                    const isSelected = isComplex ? (Array.isArray(answers[currentIndex]) && (answers[currentIndex] as string[]).includes(opt.key)) : answers[currentIndex] === opt.key;
                    return (
                      <div key={opt.key} onClick={() => handleAnswer(currentIndex, opt.key)} className={`cursor-pointer rounded-2xl border-2 p-5 transition-all ${isSelected ? "border-sky-500 bg-sky-50" : "border-slate-100 bg-white"}`}>
                        <p className={`font-bold text-left ${isSelected ? "text-sky-700" : "text-slate-600"}`}>{opt.key}. {opt.label}</p>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-12 flex justify-between">
                <Button variant="outline" onClick={goPrev} disabled={currentIndex === 0}>Sebelum</Button>
                <Button onClick={goNext} disabled={currentIndex === TOTAL_QUESTIONS - 1}>Sesudah</Button>
              </div>
            </div>
          )}
        </main>

        <aside className="w-full border-t bg-background p-4 sm:p-6 lg:w-[30%] lg:border-l lg:border-t-0">
          <h3 className="mb-6 text-xl font-bold text-left">Navigasi</h3>
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: TOTAL_QUESTIONS }).map((_, idx) => (
              <button key={idx} onClick={() => setCurrentIndex(idx)} className={`h-10 w-10 rounded-md font-bold ${idx === currentIndex ? "bg-sky-500 text-white" : answers[idx] ? "bg-emerald-500 text-white" : flagged.has(idx) ? "bg-amber-400 text-white" : "bg-slate-200 text-slate-500"}`}>{idx + 1}</button>
            ))}
          </div>
          <div className="mt-10 space-y-2 text-sm font-bold text-left">
            <p className="text-emerald-600">Terjawab: {answeredCount}</p>
            <p className="text-rose-500">Belum: {unansweredCount}</p>
          </div>
        </aside>
      </div>

      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-left">Kirim Jawaban</DialogTitle>
            <DialogDescription className="text-left">Pastikan identitas Anda benar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {unansweredCount > 0 && <p className="bg-amber-50 p-3 rounded-lg text-amber-700 text-xs font-bold text-left">Masih ada {unansweredCount} soal belum dijawab!</p>}
            <div className="space-y-2"><Label className="text-left block text-slate-700 font-bold">Nama Lengkap</Label><Input value={namaSiswa} onChange={(e) => setNamaSiswa(e.target.value)} /></div>
            <div className="space-y-2"><Label className="text-left block text-slate-700 font-bold">Kode Kelas</Label><Input value={kodeKelas} onChange={(e) => setKodeKelas(e.target.value.toUpperCase())} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>Batal</Button>
            <Button onClick={handleFinalSubmit} disabled={isSubmitting} className="bg-emerald-500 text-white font-bold">{isSubmitting ? "Mengirim..." : "Selesai & Kirim"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamInterface;
