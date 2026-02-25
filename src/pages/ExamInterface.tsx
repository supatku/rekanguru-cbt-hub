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
  Heart,
  RefreshCw,
  Clock,
  Flag,
  LayoutPanelLeft,
  Info,
  Trophy,
  Calculator,
  BookText,
  Building,
  FileText,
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

  const mapelLabel = useMemo(() => {
    if (!mapel) return "";
    if (mapel === "matematika") return "Matematika";
    if (mapel === "bahasa" || mapel === "bahasa-indonesia") return "Bahasa Indonesia";
    if (mapel === "karakter" || mapel === "survei-karakter") return "Survei Karakter";
    if (mapel === "sulingjar") return "Sulingjar";
    return mapel;
  }, [mapel]);

  const isSulingjar = mapelLabel === "Sulingjar";
  const isSurvey = mapelLabel === "Survei Karakter" || isSulingjar;

  const subjectTheme = useMemo(() => {
    const label = mapelLabel.toLowerCase().trim();

    if (label.includes("matematika")) {
      return {
        icon: Calculator,
        headerBg: "bg-blue-500 shadow-blue-500/20",
        optionSelected: "border-blue-500 bg-blue-50/30",
        numberSelected: "bg-blue-500 border-blue-500 text-white"
      };
    }
    if (label.includes("bahasa") || label.includes("membaca")) {
      return {
        icon: BookText,
        headerBg: "bg-indigo-500 shadow-indigo-500/20",
        optionSelected: "border-indigo-500 bg-indigo-50/30",
        numberSelected: "bg-indigo-500 border-indigo-500 text-white"
      };
    }
    if (label.includes("karakter")) {
      return {
        icon: Heart,
        headerBg: "bg-rose-500 shadow-rose-500/20",
        optionSelected: "border-rose-400 bg-rose-50",
        numberSelected: "bg-rose-500 border-rose-500 text-white"
      };
    }
    if (label.includes("lingkungan") || label.includes("sulingjar")) {
      return {
        icon: Building,
        headerBg: "bg-emerald-500 shadow-emerald-500/20",
        optionSelected: "border-emerald-500 bg-emerald-50",
        numberSelected: "bg-emerald-500 border-emerald-500 text-white"
      };
    }

    // Fallback Safeguard
    return {
      icon: FileText,
      headerBg: "bg-slate-500 shadow-slate-500/20",
      optionSelected: "border-slate-400 bg-slate-50",
      numberSelected: "bg-slate-500 border-slate-500 text-white"
    };
  }, [mapelLabel]);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[] | Record<string, string>>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());

  const initialSeconds = isSurvey ? 1800 : 3600; // 30 mins for surveys, 60 mins for exams
  const [seconds, setSeconds] = useState(initialSeconds);

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

  useEffect(() => {
    fetchQuestions();
    // Update timer when mapelLabel changes
    setSeconds(isSurvey ? 1800 : 3600);
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
      let totalEarnedScore = 0;
      const incorrectByTopic: Record<string, number[]> = {};

      questions.forEach((q, idx) => {
        const studentAns = answers[idx];
        const correctAns = q.kunci_jawaban || "";
        let isCorrect = false;

        if (q.tipe_soal === "SURVEI_LIKERT") {
          // Parse format: A:4,B:3,C:2,D:1
          const weights: Record<string, number> = {};
          correctAns.split(",").forEach(part => {
            const [key, val] = part.split(":").map(v => v.trim());
            if (key && val) weights[key] = parseInt(val, 10);
          });
          const weight = weights[studentAns as string] || 0;
          totalEarnedScore += weight;
          // In survey, we don't necessarily track "correct" count in the same way,
          // but we'll use totalEarnedScore for the final percentage.
        } else if (q.tipe_soal === "BENAR_SALAH") {
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

        if (isCorrect && q.tipe_soal !== "SURVEI_LIKERT") {
          correctCount++;
        } else if (!isCorrect && q.tipe_soal !== "SURVEI_LIKERT") {
          const topic = q.topik || "Materi Umum";
          if (!incorrectByTopic[topic]) incorrectByTopic[topic] = [];
          incorrectByTopic[topic].push(idx + 1);
        }
      });

      let score = 0;
      if (isSurvey) {
        const maxScore = questions.length * 4; // Asumsi max bobot 4
        score = maxScore > 0 ? Math.round((totalEarnedScore / maxScore) * 100) : 0;
      } else {
        score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
      }
      const waktuPengerjaan = (isSurvey ? 1800 : 3600) - seconds;
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
        correct: isSurvey ? totalEarnedScore : correctCount,
        wrong: isSurvey ? (questions.length * 4) : questions.length - correctCount,
        total: isSurvey ? (questions.length * 4) : questions.length,
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
    const accuracy = finalResult.score;
    const performanceLabel = accuracy >= 80 ? (isSurvey ? "Sangat Baik" : "Hebat!") : accuracy >= 60 ? (isSurvey ? "Baik" : "Bagus!") : (isSurvey ? "Perlu Pengembangan" : "Perlu Belajar Lagi");
    const performanceColor = accuracy >= 80 ? "text-emerald-500" : accuracy >= 60 ? "text-amber-500" : "text-rose-500";
    const gradeLetter = accuracy >= 80 ? "A" : accuracy >= 60 ? "B" : accuracy >= 40 ? "C" : "E";

    return (
      <div className="min-h-screen bg-slate-50 pb-20 pt-10 px-4 md:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-400 text-white shadow-lg shadow-amber-200">
              {isSurvey ? <BookIcon className="h-10 w-10" /> : <Trophy className="h-10 w-10" />}
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight text-center">{isSurvey ? 'Hasil Survei' : 'Hasil Ujian'}</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm text-center">Paket {paket} - {mapelLabel}</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-2 space-y-6">
              <div className="overflow-hidden rounded-[32px] bg-white border-none shadow-xl">
                <div className="p-8 text-center space-y-6">
                  <div className="space-y-1">
                    <span className={`text-7xl font-black ${performanceColor}`}>{isSurvey ? accuracy + '%' : gradeLetter}</span>
                    <p className="font-bold text-slate-400 uppercase tracking-widest text-xs text-center">{isSurvey ? 'Indeks Kesesuaian' : performanceLabel}</p>
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

                  <div className="grid grid-cols-2 gap-2 pt-4">
                    <div className="rounded-2xl bg-emerald-50 p-4">
                      <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500 mb-1" />
                      <p className="text-2xl font-black text-emerald-700">{finalResult.correct}</p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase text-center">{isSurvey ? 'Total Skor' : 'Benar'}</p>
                    </div>
                    <div className="rounded-2xl bg-sky-50 p-4">
                      <LayoutPanelLeft className="mx-auto h-5 w-5 text-sky-500 mb-1" />
                      <p className="text-2xl font-black text-sky-700">{finalResult.total}</p>
                      <p className="text-[10px] font-bold text-sky-600 uppercase text-center">{isSurvey ? 'Skor Maksimal' : 'Total'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] bg-sky-500 text-white shadow-lg">
                <div className="flex items-center gap-4 p-6 text-left">
                  <div className="rounded-full bg-white/20 p-3"><Clock className="h-6 w-6" /></div>
                  <div>
                    <p className="text-xs font-bold uppercase opacity-80">Waktu Pengerjaan</p>
                    <p className="text-xl font-black">{Math.floor(((isSurvey ? 1800 : 3600) - seconds) / 60)} menit {((isSurvey ? 1800 : 3600) - seconds) % 60} detik</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-3 space-y-6">
              {!isSurvey && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500 border border-amber-200">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight text-left">
                    Analisis & Rekomendasi
                  </h3>
                </div>
              )}
              <div className="space-y-4">
                {!isSurvey && Object.entries(finalResult.analysis).length > 0 ? (
                  Object.entries(finalResult.analysis).map(([topic, qNums]) => (
                    <div
                      key={topic}
                      className="overflow-hidden rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm text-left"
                    >
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-black text-slate-800">{topic}</h4>
                          <p className="text-xs font-bold text-slate-400">
                            Kamu belum tepat di materi ini (Soal No: {qNums.join(", ")})
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-rose-100 text-rose-600 border-none font-black px-3"
                        >
                          {qNums.length} Soal
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <a
                          href={`https://www.youtube.com/results?search_query=materi+${mapelLabel}+SD+${topic}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-600"
                        >
                          <PlayCircle className="h-5 w-5" /> Video
                        </a>
                        <a
                          href={`https://www.google.com/search?q=materi+${mapelLabel}+SD+${topic}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-50 px-4 py-3 text-sm font-black text-sky-600"
                        >
                          <BookIcon className="h-5 w-5" /> Bacaan
                        </a>
                      </div>
                    </div>
                  ))
                ) : !isSurvey ? (
                  <div className="flex flex-col items-center justify-center rounded-[32px] bg-emerald-50 p-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h4 className="text-xl font-black text-emerald-800 text-center">Sempurna!</h4>
                    <p className="text-emerald-600 font-bold text-center">
                      Kamu Hebat! Semua materi sudah dikuasai.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-[32px] bg-sky-50 p-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg shadow-sky-200">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h4 className="text-xl font-black text-sky-800 text-center">Survei Selesai!</h4>
                    <p className="text-sky-600 font-bold text-center">
                      Terima kasih, {namaSiswa}! Pilihan kamu sudah terekam untuk dianalisis oleh Bapak/Ibu Guru.
                    </p>
                  </div>
                )}
              </div>
              <Button
                onClick={() => navigate("/")}
                className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black text-lg shadow-xl"
              >
                <Home className="mr-3 h-6 w-6" /> Kembali ke Beranda
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between bg-[#1e293b] px-4 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/mapel/${level}/${paket}`)}
            className="flex items-center justify-center h-10 w-10 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-lg ${subjectTheme.headerBg}`}>
              <subjectTheme.icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-bold leading-tight">
                {mapelLabel}
              </h1>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">
                {isSulingjar ? "Kualitas Lingkungan Belajar" : isSurvey ? "8 Dimensi Profil Lulusan" : "Tes Kemampuan Akademik"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-white/10 transition-colors text-slate-300"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* Timer - Relocated here */}
          <div className="flex items-center gap-2 px-3 h-10 bg-slate-700/50 rounded-lg border border-slate-600/50">
            <Clock className="h-4 w-4 text-emerald-400" />
            <span className="font-mono text-sm font-bold text-emerald-400 tracking-wider">
              {formatTime(seconds)}
            </span>
          </div>

          <div className="flex items-center justify-center min-w-[80px] h-10 px-4 rounded-lg bg-slate-700/50 text-slate-300 font-bold text-sm">
            {answeredCount}/{TOTAL_QUESTIONS}
          </div>

          <Button
            onClick={handleSubmit}
            className="h-10 rounded-lg bg-[#f97316] px-5 font-bold text-white hover:bg-orange-600 transition-all active:scale-95"
          >
            Selesai {isSurvey ? "Survei" : "Ujian"}
          </Button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 gap-6 p-6 lg:p-8">

        {/* Kolom Kiri: Konten Soal */}
        <div className="flex flex-1 flex-col space-y-6">
          {!question ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Soal tidak ditemukan.</h2>
              <p className="mt-1 text-slate-400 font-medium text-sm">Kembali ke beranda untuk memilih paket soal.</p>
              <Button onClick={() => navigate("/")} className="mt-6 h-10 rounded-xl bg-slate-900 px-6 font-bold text-white">
                Ke Beranda
              </Button>
            </div>
          ) : (
            <div className="flex flex-col flex-1">
              {/* Question Card */}
              <div className="relative flex-1 rounded-xl bg-white p-8 shadow-sm border border-slate-200/60 transition-all">
                {/* Header Card */}
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center rounded-lg bg-pink-50 px-4 py-1.5 text-sm font-bold text-pink-600">
                      Soal {currentIndex + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-400">dari {TOTAL_QUESTIONS}</span>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={toggleFlag}
                    className={`h-10 rounded-lg px-4 text-sm font-bold transition-all ${flagged.has(currentIndex)
                      ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                      : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                      }`}
                  >
                    <Flag className={`mr-2 h-4 w-4 ${flagged.has(currentIndex) ? "fill-current" : ""}`} />
                    Tandai
                  </Button>
                </div>

                {/* Scenario / Illustration */}
                <div className="mb-8 rounded-xl bg-[#f0f7ff] border border-blue-100/50 p-6">
                  {question.link_gambar && (
                    <img
                      src={question.link_gambar}
                      alt="Ilustrasi"
                      className="mb-6 w-full max-h-64 rounded-xl object-contain bg-white shadow-sm"
                    />
                  )}
                  <p className="text-[15px] font-medium leading-relaxed text-slate-600">
                    {question.teks_soal}
                  </p>
                </div>

                {/* Options List */}
                <div className="space-y-3">
                  {question.tipe_soal === "BENAR_SALAH" ? (
                    question.opsi_jawaban?.map((opt) => {
                      const sMap = (typeof answers[currentIndex] === "object" && !Array.isArray(answers[currentIndex]))
                        ? answers[currentIndex] as Record<string, string>
                        : {};
                      return (
                        <div key={opt.key} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-400">
                          <p className="mb-4 text-sm font-bold text-slate-700">{opt.label}</p>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => handleAnswer(currentIndex, `${opt.key}:B`)}
                              className={`flex h-11 items-center justify-center rounded-lg text-sm font-bold transition-all ${sMap[opt.key] === "B"
                                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                }`}
                            >
                              Benar
                            </button>
                            <button
                              onClick={() => handleAnswer(currentIndex, `${opt.key}:S`)}
                              className={`flex h-11 items-center justify-center rounded-lg text-sm font-bold transition-all ${sMap[opt.key] === "S"
                                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                                : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                }`}
                            >
                              Salah
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    question.opsi_jawaban?.map((opt) => {
                      const isComplex = question.tipe_soal === "PG_KOMPLEKS";
                      const isSelected = isComplex
                        ? (Array.isArray(answers[currentIndex]) && (answers[currentIndex] as string[]).includes(opt.key))
                        : answers[currentIndex] === opt.key;

                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleAnswer(currentIndex, opt.key)}
                          className={`group flex items-center gap-4 w-full rounded-xl border p-4 text-left transition-all ${isSelected
                            ? subjectTheme.optionSelected
                            : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                            }`}
                        >
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition-all ${isSelected
                            ? subjectTheme.numberSelected
                            : "bg-slate-50 border-slate-200 text-slate-400 group-hover:border-blue-200"
                            }`}>
                            {opt.key}
                          </div>
                          <p className={`text-[15px] font-medium leading-tight ${isSelected
                            ? (isSulingjar ? "text-emerald-700" : isSurvey ? "text-rose-900" : "text-blue-900")
                            : "text-slate-600 group-hover:text-slate-800"
                            }`}>
                            {opt.label}
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Navigation Footer */}
              <div className="flex items-center justify-between py-6">
                <button
                  onClick={goPrev}
                  disabled={currentIndex === 0}
                  className="flex h-11 items-center gap-2 rounded-lg px-6 text-sm font-bold text-slate-400 transition-all hover:text-slate-600 disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Sebelumnya
                </button>

                <div className="text-sm font-bold text-slate-400">
                  {currentIndex + 1} / {TOTAL_QUESTIONS}
                </div>

                <button
                  onClick={goNext}
                  disabled={currentIndex === TOTAL_QUESTIONS - 1}
                  className="flex h-11 items-center gap-2 rounded-lg bg-[#0ea5e9] px-6 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition-all hover:bg-sky-500 active:scale-95 disabled:opacity-30"
                >
                  Selanjutnya
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Sidebar */}
        <aside className="hidden flex-col space-y-4 lg:flex lg:w-[320px]">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200/60">
            <h3 className="mb-4 text-[15px] font-bold text-slate-800">Navigasi Soal</h3>

            {/* Legend */}
            <div className="mb-6 grid grid-cols-2 gap-x-2 gap-y-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-blue-500" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Aktif</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-emerald-500" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Terjawab</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-amber-400" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Ditandai</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-slate-100 border border-slate-200" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Belum</span>
              </div>
            </div>

            {/* Grid Soal */}
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: TOTAL_QUESTIONS }).map((_, idx) => {
                const isSelected = idx === currentIndex;
                const isAnswered = answers[idx] !== undefined && (
                  typeof answers[idx] === "string" ? answers[idx] !== "" :
                    Array.isArray(answers[idx]) ? (answers[idx] as any).length > 0 :
                      Object.keys(answers[idx] as any).length > 0
                );
                const isFlagged = flagged.has(idx);

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`flex h-10 w-full items-center justify-center rounded font-bold text-sm transition-all ${isSelected
                      ? "bg-[#0ea5e9] text-white shadow-md shadow-sky-400/30"
                      : isFlagged
                        ? "bg-amber-400 text-white"
                        : isAnswered
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Summary Stat */}
            <div className="mt-8 space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium">Terjawab</span>
                <span className="text-xs font-bold text-emerald-600">{answeredCount} soal</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium">Belum dijawab</span>
                <span className="text-xs font-bold text-rose-500">{unansweredCount} soal</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium">Ditandai</span>
                <span className="text-xs font-bold text-amber-500">{flaggedCount} soal</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Kirim Jawaban</DialogTitle>
            <DialogDescription>Pastikan identitas Anda benar sebelum mengakhiri sesi.</DialogDescription>
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
