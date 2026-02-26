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
  Send,
  BarChart3,
  Star,
  Download,
  Printer,
  ArrowLeft,
  ExternalLink,
  KeyRound,
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Results View State
  const [showResults, setShowResults] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
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

  const calculateResults = useCallback(() => {
    let correctCount = 0;
    let totalEarnedScore = 0;
    const incorrectByTopic: Record<string, number[]> = {};

    questions.forEach((q, idx) => {
      const studentAns = answers[idx];
      const correctAns = q.kunci_jawaban || "";
      let isCorrect = false;

      if (q.tipe_soal === "SURVEI_LIKERT") {
        const weights: Record<string, number> = {};
        correctAns.split(",").forEach(part => {
          const [key, val] = part.split(":").map(v => v.trim());
          if (key && val) weights[key] = parseInt(val, 10);
        });
        const weight = weights[studentAns as string] || 0;
        totalEarnedScore += weight;
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
      const maxScore = questions.length * 4;
      score = maxScore > 0 ? Math.round((totalEarnedScore / maxScore) * 100) : 0;
    } else {
      score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    }

    return {
      score,
      correct: isSurvey ? totalEarnedScore : correctCount,
      wrong: isSurvey ? (questions.length * 4) : questions.length - correctCount,
      total: isSurvey ? (questions.length * 4) : questions.length,
      analysis: incorrectByTopic
    };
  }, [questions, answers, isSurvey]);

  const handleSubmit = useCallback(() => {
    const results = calculateResults();
    setFinalResult(results);
    setShowResults(true);
  }, [calculateResults]);

  const handleFinalSubmit = async () => {
    if (!namaSiswa.trim() || !kodeKelas.trim()) {
      toast.error("Nama dan Kode Kelas wajib diisi!");
      return;
    }

    setIsSubmitting(true);

    try {
      const kodeKelasUpper = kodeKelas.trim().toUpperCase();
      const namaSiswaTrim = namaSiswa.trim();
      const paketNumber = parseInt(paket || '1', 10);
      const activeLicenseCode = localStorage.getItem("active_license_code");

      console.log("--- SUBMIT START ---");
      console.log("Step 1: License Code Check");
      if (!activeLicenseCode) {
        console.error("License code not found in localStorage");
        toast.error("Kode lisensi tidak ditemukan. Silakan aktivasi ulang.");
        setIsSubmitting(false);
        return;
      }
      console.log("License code exists:", activeLicenseCode);

      // 2. Anti-Cheat: Check if this exact submission exists
      console.log("Step 2: Anti-Cheat Check");
      const { data: existingSubmit, error: checkError } = await supabase
        .from('tka_hasil_ujian')
        .select('id')
        .eq('nama_siswa', namaSiswaTrim)
        .eq('kode_kelas', kodeKelasUpper)
        .eq('mapel', mapelLabel)
        .eq('paket_ke', isNaN(paketNumber) ? 1 : paketNumber)
        .eq('kode_lisensi', activeLicenseCode);

      if (existingSubmit && existingSubmit.length > 0) {
        console.warn("Duplicate submission detected");
        toast.error(`Anda sudah mengerjakan paket ini.`);
        setIsSubmitting(false);
        return;
      }

      // 3. Check Siswa Status (Siswa Lama vs Siswa Baru)
      console.log("Step 3: Student Status Check");
      const { data: existingStudent, error: studentError } = await supabase
        .from('tka_hasil_ujian')
        .select('id')
        .eq('nama_siswa', namaSiswaTrim)
        .eq('kode_kelas', kodeKelasUpper)
        .eq('kode_lisensi', activeLicenseCode);

      const isNewStudent = !existingStudent || existingStudent.length === 0;
      console.log("Is New Student:", isNewStudent);

      if (isNewStudent) {
        // 4. B. SISWA BARU: Fetch real-time quota and increment
        console.log("Processing as NEW student. Fetching quota...");
        const { data: licenseData, error: licenseError } = await supabase
          .from('tka_lisensi')
          .select('terpakai, batas_kuota')
          .eq('kode', activeLicenseCode)
          .single();

        if (licenseError || !licenseData) {
          console.error("License not found in database:", licenseError);
          toast.error("Lisensi tidak valid. Hubungi admin.");
          setIsSubmitting(false);
          return;
        }

        console.log(`Current Quota: ${licenseData.terpakai} / ${licenseData.batas_kuota}`);

        if (licenseData.terpakai >= licenseData.batas_kuota) {
          console.warn("Quota reached limit");
          toast.error("Kuota aktivasi telah mencapai batas. Hubungi admin.");
          setIsSubmitting(false);
          return;
        }

        console.log("Step 4: Incrementing Quota...");
        const { error: updateError } = await supabase
          .from('tka_lisensi')
          .update({ terpakai: licenseData.terpakai + 1 })
          .eq('kode', activeLicenseCode);

        if (updateError) {
          console.error("Failed to increment quota:", updateError);
          throw new Error("Gagal mengupdate kuota.");
        }
        console.log("Quota increment success.");
      } else {
        console.log("Processing as RETURNING student. Skipping quota check.");
      }

      console.log("Proceeding to exam scoring...");
      const results = finalResult || calculateResults();
      const { score, correct: correctCount } = results;
      const waktuPengerjaan = (isSurvey ? 1800 : 3600) - seconds;

      console.log("Step 5: Final Results Insertion");
      const { error } = await supabase
        .from('tka_hasil_ujian')
        .insert([{
          kode_kelas: kodeKelasUpper,
          nama_siswa: namaSiswaTrim,
          jenjang: level?.toUpperCase(),
          paket_ke: isNaN(paketNumber) ? 1 : paketNumber,
          mapel: mapelLabel,
          skor_total: Number(score),
          waktu_pengerjaan: Number(waktuPengerjaan),
          total_benar: Number(correctCount),
          total_soal: Number(questions.length),
          kode_lisensi: activeLicenseCode
        }]);

      if (error) {
        console.error("Result insertion failed:", error);
        throw error;
      }

      console.log("Submission COMPLETE. Showing results.");

      if (!finalResult) {
        setFinalResult(results);
      }
      setIsSubmitted(true);
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

    // Dummy dimension data for Character Survey visualization
    const dimensiKarakter = [
      { nama: 'Keimanan dan Ketakwaan', skor: 67, status: 'Cukup', color: 'bg-teal-500', hex: '#0d9488' },
      { nama: 'Kewargaan', skor: 100, status: 'Sangat Baik', color: 'bg-blue-500', hex: '#3b82f6' },
      { nama: 'Penalaran Kritis', skor: 100, status: 'Sangat Baik', color: 'bg-orange-500', hex: '#f97316' },
      { nama: 'Kreativitas', skor: 100, status: 'Sangat Baik', color: 'bg-red-500', hex: '#ef4444' },
      { nama: 'Kolaborasi', skor: 100, status: 'Sangat Baik', color: 'bg-indigo-500', hex: '#8b5cf6' },
      { nama: 'Kemandirian', skor: 100, status: 'Sangat Baik', color: 'bg-pink-500', hex: '#ec4899' },
      { nama: 'Kesehatan', skor: 80, status: 'Baik', color: 'bg-teal-400', hex: '#2dd4bf' },
      { nama: 'Komunikasi', skor: 100, status: 'Sangat Baik', color: 'bg-rose-500', hex: '#f43f5e' },
    ];

    // ─── SURVEY KARAKTER: Premium Pink-Pastel Results UI ───
    if (isSurvey) {
      return (
        <div className="min-h-screen bg-pink-50 pb-10">
          {/* Header */}
          <header className="pt-12 pb-8 px-4 text-center">
            <div className="mx-auto w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-200 mb-4">
              <Heart className="text-white w-8 h-8 fill-current" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hasil Survei Karakter</h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2">8 Dimensi Profil Lulusan</p>
          </header>

          <main className="max-w-6xl mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Score Summary Card */}
                <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-pink-100/50 border border-pink-50 flex flex-col items-center text-center">
                  <span className="text-7xl font-black text-teal-600 tracking-tighter mb-2">
                    {accuracy}%
                  </span>
                  <Badge className="bg-emerald-100 text-emerald-600 hover:bg-emerald-100 border-none font-black px-6 py-2 rounded-full text-sm mb-8">
                    {performanceLabel}
                  </Badge>
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="bg-pink-50 rounded-2xl p-4 flex flex-col items-center">
                      <CheckCircle2 className="w-5 h-5 text-pink-500 mb-1" />
                      <span className="text-2xl font-black text-slate-800">{finalResult.correct}</span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Skor</p>
                    </div>
                    <div className="bg-pink-50 rounded-2xl p-4 flex flex-col items-center">
                      <LayoutPanelLeft className="w-5 h-5 text-pink-500 mb-1" />
                      <span className="text-2xl font-black text-slate-800">{finalResult.total}</span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skor Maksimal</p>
                    </div>
                  </div>
                </div>

                {/* Horizontal Bar Chart Card */}
                <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-pink-100/50 border border-pink-50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-black text-slate-800">Skor per Dimensi</h2>
                  </div>
                  <div className="space-y-4">
                    {dimensiKarakter.map((dim, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500 truncate max-w-[120px]">{dim.nama}</span>
                          <span className="text-[11px] font-black text-slate-600">{dim.skor}%</span>
                        </div>
                        <div className="h-5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${dim.color} transition-all duration-1000 ease-out`}
                            style={{ width: `${dim.skor}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Detail Dimensi */}
              <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-pink-100/50 border border-pink-50 flex flex-col overflow-hidden" style={{ maxHeight: '720px' }}>
                <div className="flex items-center gap-3 mb-6 shrink-0">
                  <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-pink-500">
                    <BookIcon className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-black text-slate-800">Detail Dimensi Karakter</h2>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-5">
                  {dimensiKarakter.map((dim, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-700">{dim.nama}</span>
                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-lg ${dim.skor >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}
                        >
                          {dim.skor}%
                        </span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${dim.skor}%`, backgroundColor: dim.hex }}
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dim.hex }} />
                        <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: dim.hex }}>
                          {dim.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 space-y-4 max-w-6xl mx-auto">
              {!isSubmitted && (
                <Button
                  onClick={() => setIsSubmitDialogOpen(true)}
                  className="w-full h-14 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-black text-lg shadow-xl shadow-pink-200/50 flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                  <Send className="w-6 h-6 rotate-[-20deg]" /> Kirim Hasil ke Guru
                </Button>
              )}
              {isSubmitted && (
                <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-bold text-emerald-700">Hasil sudah terkirim ke Guru!</span>
                </div>
              )}
              <Button
                onClick={() => navigate("/")}
                className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black text-lg shadow-xl"
              >
                <Home className="mr-3 h-6 w-6" /> Kembali ke Beranda
              </Button>
            </div>
          </main>

          {/* ═══ Submit Identity Modal (MUST be inside this return) ═══ */}
          <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
            <DialogContent className="sm:max-w-[480px] rounded-[24px] border-none p-8 gap-6 shadow-2xl z-[100]">
              <DialogHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-500">
                    <Send className="w-6 h-6" />
                  </div>
                  <DialogTitle className="text-2xl font-black text-slate-800">Kirim Hasil ke Guru</DialogTitle>
                </div>
                <DialogDescription className="text-slate-500 font-medium leading-relaxed">
                  Masukkan kode kelas dan nama lengkapmu untuk mengirim hasil survei ke guru.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 py-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Nama Lengkap</Label>
                  <input
                    value={namaSiswa}
                    onChange={(e) => setNamaSiswa(e.target.value)}
                    placeholder="Masukkan nama lengkapmu"
                    className="w-full border-2 border-gray-200 bg-gray-50 p-4 rounded-xl focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-50/50 outline-none transition-all font-medium text-slate-800 placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Kode Kelas</Label>
                  <input
                    value={kodeKelas}
                    onChange={(e) => setKodeKelas(e.target.value.toUpperCase())}
                    placeholder="Contoh: MONO123"
                    className="w-full border-2 border-gray-200 bg-gray-50 p-4 rounded-xl focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-50/50 outline-none transition-all font-black text-slate-800 placeholder:text-gray-400 uppercase tracking-wider"
                  />
                </div>
              </div>
              <div className="pt-2">
                <Button
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className={`w-full h-14 rounded-xl text-white font-bold text-lg shadow-lg transition-all active:scale-[0.98] ${isSubmitting ? "bg-slate-400 cursor-not-allowed" : "bg-rose-500 hover:bg-rose-600 shadow-rose-200"}`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Mengirim...</span>
                    </div>
                  ) : (
                    "Kirim Hasil"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );
    }

    // ─── EXAM REGULAR: Comprehensive Results UI ───
    // Dummy analytics data for visualization
    const topikPerformance = [
      { nama: 'Operasi Pecahan', persen: 0 },
      { nama: 'Satuan Volume', persen: 33 },
      { nama: 'Kecepatan', persen: 50 },
      { nama: 'Sudut & Pengukuran', persen: 67 },
      { nama: 'KPK & FPB', persen: 80 },
      { nama: 'Piktogram & Diagram', persen: 100 },
    ];
    const materiKuat = [
      { nama: 'Visualisasi Spasial', benar: 1, total: 1, persen: 100 },
      { nama: 'Diagram Batang', benar: 1, total: 1, persen: 100 },
      { nama: 'Prediksi Data', benar: 1, total: 1, persen: 100 },
      { nama: 'Piktogram', benar: 1, total: 1, persen: 100 },
    ];
    const materiLemah = [
      { nama: 'Pecahan Senilai', benar: 0, total: 1, persen: 0 },
      { nama: 'Perbandingan Pecahan', benar: 0, total: 1, persen: 0 },
      { nama: 'Relasi Pecahan', benar: 0, total: 1, persen: 0 },
    ];

    const waktuDipakai = (isSurvey ? 1800 : 3600) - seconds;
    const menit = Math.floor(waktuDipakai / 60);
    const detik = waktuDipakai % 60;

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50/30 pb-10">
        {/* ── Header ── */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
          <div className="max-w-5xl mx-auto flex items-center gap-4 px-4 h-16">
            <button onClick={() => navigate(-1)} className="flex items-center justify-center h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-tight">Hasil Ujian</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Paket {paket} - {mapelLabel}</p>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 pt-8 space-y-8">
          {/* ── Score Card ── */}
          <div className="bg-white rounded-[28px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center space-y-6">
            <div className={`text-8xl font-black tracking-tighter ${performanceColor}`}>
              {accuracy}%
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-50 font-black px-4 py-2 rounded-full text-sm gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> {finalResult.correct} Benar
              </Badge>
              <Badge className="bg-rose-50 text-rose-500 border border-rose-200 hover:bg-rose-50 font-black px-4 py-2 rounded-full text-sm gap-1.5">
                <XCircle className="w-4 h-4" /> {finalResult.wrong} Salah
              </Badge>
              <Badge className="bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-50 font-black px-4 py-2 rounded-full text-sm gap-1.5">
                <LayoutPanelLeft className="w-4 h-4" /> {finalResult.total} Total
              </Badge>
              <Badge className="bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-50 font-black px-4 py-2 rounded-full text-sm gap-1.5">
                <Clock className="w-4 h-4" /> {menit}m {detik}s
              </Badge>
            </div>
          </div>

          {/* ── Performa per Topik ── */}
          <div className="bg-white rounded-[28px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-500">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-slate-800">Performa per Topik</h2>
            </div>
            <div className="space-y-4">
              {topikPerformance.sort((a, b) => a.persen - b.persen).map((t, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">{t.nama}</span>
                    <span className="text-xs font-black text-slate-700">{t.persen}%</span>
                  </div>
                  <div className="h-5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-teal-400 transition-all duration-1000 ease-out"
                      style={{ width: `${Math.max(t.persen, 2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">
              <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
            </div>
          </div>

          {/* ── Split Card: Materi Kuat vs Lemah ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Materi Kuat */}
            <div className="bg-white rounded-[28px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-white" />
                <h3 className="text-white font-black text-sm uppercase tracking-wider">Materi Kuat</h3>
              </div>
              <div className="p-6 space-y-4">
                {materiKuat.map((m, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-none">
                    <span className="text-sm font-bold text-slate-700">{m.nama}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400">{m.benar}/{m.total}</span>
                      <Badge className="bg-emerald-50 text-emerald-600 border-none hover:bg-emerald-50 font-black text-xs">{m.persen}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Perlu Ditingkatkan */}
            <div className="bg-white rounded-[28px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-white" />
                <h3 className="text-white font-black text-sm uppercase tracking-wider">Perlu Ditingkatkan</h3>
              </div>
              <div className="p-6 space-y-5">
                {materiLemah.map((m, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700">{m.nama}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400">{m.benar}/{m.total}</span>
                        <Badge className="bg-rose-50 text-rose-500 border-none hover:bg-rose-50 font-black text-xs">{m.persen}%</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`https://www.youtube.com/results?search_query=materi+${mapelLabel}+SD+${m.nama}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-[11px] font-bold text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        <PlayCircle className="h-3.5 w-3.5" /> Video
                      </a>
                      <a
                        href={`https://www.google.com/search?q=materi+${mapelLabel}+SD+${m.nama}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-sky-200 px-3 py-2 text-[11px] font-bold text-sky-500 hover:bg-sky-50 transition-colors"
                      >
                        <BookIcon className="h-3.5 w-3.5" /> Bacaan
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Rekomendasi Belajar ── */}
          <div className="bg-amber-50 border border-amber-100 rounded-[28px] p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                <Star className="w-6 h-6 fill-current" />
              </div>
              <h2 className="text-lg font-black text-amber-800">Rekomendasi Belajar</h2>
            </div>
            <p className="text-amber-700 font-medium leading-relaxed mb-4">
              Terus berlatih, kamu pasti bisa lebih baik! Fokus pada materi yang perlu ditingkatkan.
            </p>
            <ul className="space-y-2">
              {materiLemah.map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>Pelajari kembali <span className="font-black">{m.nama}</span> — klik topik di atas untuk video dan bacaan.</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Action Grid ── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className={`h-14 rounded-2xl border-2 font-bold text-sm shadow-sm gap-2 ${showAnswerKey
                ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                }`}
              onClick={() => setShowAnswerKey(!showAnswerKey)}
            >
              <BookText className="w-5 h-5" /> {showAnswerKey ? "Sembunyikan Kunci" : "Kunci Jawaban"}
            </Button>
            <Button
              variant="outline"
              className="h-14 rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-sm gap-2"
              onClick={() => {
                const doc = new jsPDF();
                const pageWidth = doc.internal.pageSize.getWidth();
                const now = new Date();
                const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                const tanggal = `${now.getDate()} ${bulan[now.getMonth()]} ${now.getFullYear()}`;

                // Header
                doc.setFontSize(18);
                doc.setFont('helvetica', 'bold');
                doc.text('LAPORAN HASIL UJIAN', pageWidth / 2, 28, { align: 'center' });
                doc.setFontSize(12);
                doc.setFont('helvetica', 'normal');
                doc.text('Tes Kemampuan Akademik (TKA)', pageWidth / 2, 36, { align: 'center' });
                doc.setDrawColor(200);
                doc.line(20, 42, pageWidth - 20, 42);

                // Metadata
                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');
                const meta = [
                  ['Nama Siswa', namaSiswa.trim() || 'Siswa'],
                  ['Paket Soal', `Paket ${paket}`],
                  ['Mata Pelajaran', mapelLabel],
                  ['Waktu', `${menit} menit ${detik} detik`],
                  ['Tanggal', tanggal],
                ];
                let yPos = 52;
                meta.forEach(([label, val]) => {
                  doc.setFont('helvetica', 'bold');
                  doc.text(`${label}:`, 20, yPos);
                  doc.setFont('helvetica', 'normal');
                  doc.text(val, 70, yPos);
                  yPos += 8;
                });

                // Score box
                yPos += 6;
                doc.setFillColor(245, 247, 250);
                doc.roundedRect(20, yPos, pageWidth - 40, 35, 4, 4, 'F');
                doc.setFontSize(28);
                doc.setFont('helvetica', 'bold');
                doc.text(`${accuracy}%`, pageWidth / 2, yPos + 18, { align: 'center' });
                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');
                doc.text(`${finalResult.correct} dari ${finalResult.total} soal benar`, pageWidth / 2, yPos + 28, { align: 'center' });

                // Topic analysis table
                yPos += 45;
                doc.setFontSize(13);
                doc.setFont('helvetica', 'bold');
                doc.text('Analisis Per Topik', 20, yPos);
                yPos += 4;

                // Dynamic topic analysis from actual questions/answers
                const topicMap: Record<string, { benar: number; total: number }> = {};
                questions.forEach((q, idx) => {
                  const topicName = q.topik || 'Materi Umum';
                  if (!topicMap[topicName]) topicMap[topicName] = { benar: 0, total: 0 };
                  topicMap[topicName].total++;
                  const studentAns = answers[idx];
                  const correctAns = q.kunci_jawaban || '';
                  let isCorrect = false;
                  if (q.tipe_soal === 'BENAR_SALAH') {
                    const sm = (typeof studentAns === 'object' && !Array.isArray(studentAns)) ? studentAns as Record<string, string> : {};
                    const cp = correctAns.split(',').map(v => v.trim());
                    let ok = cp.length > 0;
                    cp.forEach(p => { const [k, v] = p.split(':'); if (sm[k] !== v) ok = false; });
                    isCorrect = ok;
                  } else if (q.tipe_soal === 'PG_KOMPLEKS') {
                    const sa = Array.isArray(studentAns) ? [...studentAns].sort() : [];
                    const ca = correctAns.split(',').map(v => v.trim()).sort();
                    isCorrect = sa.length > 0 && sa.join(',') === ca.join(',');
                  } else {
                    isCorrect = studentAns === correctAns;
                  }
                  if (isCorrect) topicMap[topicName].benar++;
                });

                const tableData = Object.entries(topicMap).map(([nama, d]) => {
                  const persen = d.total > 0 ? Math.round((d.benar / d.total) * 100) : 0;
                  return [
                    nama,
                    `${d.benar}/${d.total}`,
                    `${persen}%`,
                    persen >= 80 ? 'Sangat Baik' : persen >= 60 ? 'Baik' : 'Perlu Ditingkatkan',
                  ];
                });

                autoTable(doc, {
                  startY: yPos,
                  head: [['Topik', 'Benar/Total', 'Persentase', 'Status']],
                  body: tableData,
                  margin: { left: 20, right: 20 },
                  styles: { fontSize: 10, cellPadding: 4 },
                  headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold' },
                  alternateRowStyles: { fillColor: [248, 250, 252] },
                });

                // Detail Kunci Jawaban table
                const lastY = (doc as any).lastAutoTable?.finalY || yPos + 50;
                const detailStartY = lastY + 15;
                doc.setFontSize(13);
                doc.setFont('helvetica', 'bold');
                doc.text('Detail Kunci Jawaban', 20, detailStartY);

                const detailData = questions.map((q, idx) => {
                  const studentAns = answers[idx];
                  const correctAns = q.kunci_jawaban || '';
                  let isCorrect = false;
                  if (q.tipe_soal === 'BENAR_SALAH') {
                    const sm = (typeof studentAns === 'object' && !Array.isArray(studentAns)) ? studentAns as Record<string, string> : {};
                    const cp = correctAns.split(',').map(v => v.trim());
                    let ok = cp.length > 0;
                    cp.forEach(p => { const [k, v] = p.split(':'); if (sm[k] !== v) ok = false; });
                    isCorrect = ok;
                  } else if (q.tipe_soal === 'PG_KOMPLEKS') {
                    const sa = Array.isArray(studentAns) ? [...studentAns].sort() : [];
                    const ca = correctAns.split(',').map(v => v.trim()).sort();
                    isCorrect = sa.length > 0 && sa.join(',') === ca.join(',');
                  } else {
                    isCorrect = studentAns === correctAns;
                  }
                  const ansStr = studentAns != null ? String(typeof studentAns === 'object' ? JSON.stringify(studentAns) : studentAns) : '-';
                  return [
                    String(idx + 1),
                    q.topik || 'Umum',
                    ansStr,
                    correctAns,
                    isCorrect ? 'Benar' : 'Salah',
                  ];
                });

                autoTable(doc, {
                  startY: detailStartY + 4,
                  head: [['No', 'Topik Soal', 'Jawaban Siswa', 'Kunci Jawaban', 'Status']],
                  body: detailData,
                  margin: { left: 20, right: 20 },
                  styles: { fontSize: 9, cellPadding: 3 },
                  headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold' },
                  alternateRowStyles: { fillColor: [248, 250, 252] },
                  columnStyles: {
                    0: { cellWidth: 12, halign: 'center' },
                    4: { cellWidth: 20, halign: 'center' },
                  },
                  didParseCell: (data: any) => {
                    if (data.section === 'body' && data.column.index === 4) {
                      if (data.cell.raw === 'Benar') {
                        data.cell.styles.textColor = [22, 163, 74];
                        data.cell.styles.fontStyle = 'bold';
                      } else {
                        data.cell.styles.textColor = [220, 38, 38];
                        data.cell.styles.fontStyle = 'bold';
                      }
                    }
                  },
                });

                const fileName = `Hasil_${mapelLabel.replace(/\s/g, '_')}_Paket${paket}_${menit}m${detik}s.pdf`;
                doc.save(fileName);
                toast.success('PDF berhasil diunduh!');
              }}
            >
              <Download className="w-5 h-5 text-slate-400" /> Download PDF
            </Button>
            <Button
              variant="outline"
              className="h-14 rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-sm gap-2"
              onClick={() => setIsPrintModalOpen(true)}
            >
              <Printer className="w-5 h-5 text-slate-400" /> Print Soal
            </Button>
            <Button
              className="h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-sm shadow-amber-200 gap-2"
              onClick={() => {
                setShowResults(false);
                setFinalResult(null);
                setAnswers(new Array(questions.length).fill(null));
                setCurrentIndex(0);
              }}
            >
              <RefreshCw className="w-5 h-5" /> Ulangi Ujian
            </Button>
            <Button
              className={`h-14 rounded-2xl text-white font-bold text-sm shadow-lg gap-2 col-span-1 transition-all ${isSubmitted
                  ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-200 animate-bounce"
                }`}
              onClick={() => {
                if (!isSubmitted) {
                  setIsSubmitDialogOpen(true);
                } else {
                  toast.success("Hasil sudah terkirim!");
                }
              }}
            >
              {isSubmitted ? <CheckCircle2 className="w-5 h-5" /> : <Send className="w-5 h-5 animate-pulse" />}
              {isSubmitted ? "Terkirim" : "Kirim ke Guru"}
            </Button>
            <Button
              variant="outline"
              className="h-14 rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-sm gap-2"
              onClick={() => navigate(`/mapel/${level}/${paket}`)}
            >
              <ExternalLink className="w-5 h-5 text-slate-400" /> Paket Lain
            </Button>
          </div>

          {/* ── Print Modal ── */}
          {isPrintModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setIsPrintModalOpen(false)}>
              <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md p-8 mx-4 space-y-5" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-800">Print Soal</h2>
                  <button onClick={() => setIsPrintModalOpen(false)} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-500">Pilih jenis dokumen yang ingin di-print.</p>
                <div className="space-y-3">
                  {/* Soal Ujian card */}
                  <button
                    className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-100 hover:bg-indigo-50 hover:border-indigo-200 transition-all text-left"
                    onClick={() => {
                      const doc = new jsPDF();
                      const pw = doc.internal.pageSize.getWidth();
                      const ph = doc.internal.pageSize.getHeight();

                      // Blue header
                      doc.setFillColor(79, 70, 229);
                      doc.rect(0, 0, pw, 45, 'F');
                      doc.setTextColor(255, 255, 255);
                      doc.setFontSize(20);
                      doc.setFont('helvetica', 'bold');
                      doc.text(`SOAL ${mapelLabel.toUpperCase()}`, pw / 2, 22, { align: 'center' });
                      doc.setFontSize(11);
                      doc.setFont('helvetica', 'normal');
                      doc.text(`Paket ${paket} - Tes Kemampuan Akademik`, pw / 2, 34, { align: 'center' });

                      // Instructions
                      doc.setTextColor(0, 0, 0);
                      doc.setFontSize(10);
                      doc.setFont('helvetica', 'bold');
                      doc.text('Petunjuk Pengerjaan:', 20, 58);
                      doc.setFont('helvetica', 'normal');
                      doc.setFontSize(9);
                      doc.text('Pilihlah satu jawaban yang paling tepat dari setiap soal berikut.', 20, 65);
                      doc.setDrawColor(200);
                      doc.line(20, 70, pw - 20, 70);

                      let y = 80;
                      const maxW = pw - 40;

                      questions.forEach((q, idx) => {
                        // Check page break (need ~60px min for a question)
                        if (y > ph - 60) {
                          doc.addPage();
                          y = 25;
                        }

                        // Soal number (blue) + topik (gray)
                        doc.setFontSize(11);
                        doc.setFont('helvetica', 'bold');
                        doc.setTextColor(79, 70, 229);
                        doc.text(`Soal ${idx + 1}`, 20, y);
                        doc.setFont('helvetica', 'italic');
                        doc.setFontSize(9);
                        doc.setTextColor(140, 140, 140);
                        doc.text(q.topik || 'Umum', 50, y);
                        y += 7;

                        // Question text with word wrap
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(10);
                        doc.setTextColor(30, 30, 30);
                        const lines = doc.splitTextToSize(q.teks_soal || '', maxW);
                        lines.forEach((line: string) => {
                          if (y > ph - 20) { doc.addPage(); y = 25; }
                          doc.text(line, 20, y);
                          y += 5;
                        });
                        y += 3;

                        // Options
                        if (q.opsi_jawaban && q.opsi_jawaban.length > 0) {
                          q.opsi_jawaban.forEach((opt) => {
                            if (y > ph - 15) { doc.addPage(); y = 25; }
                            doc.setFontSize(10);
                            doc.setTextColor(50, 50, 50);
                            const optLines = doc.splitTextToSize(`${opt.key}. ${opt.label}`, maxW - 10);
                            optLines.forEach((ol: string) => {
                              doc.text(ol, 28, y);
                              y += 5;
                            });
                          });
                        }
                        y += 8;
                      });

                      doc.save(`Soal_${mapelLabel.replace(/\s/g, '_')}_Paket${paket}.pdf`);
                      setIsPrintModalOpen(false);
                      toast.success('PDF Soal berhasil diunduh!');
                    }}
                  >
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shrink-0">
                      <BookIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">Soal Ujian</p>
                      <p className="text-xs text-slate-400">Download soal dalam format PDF untuk dicetak</p>
                    </div>
                  </button>

                  {/* Kunci Jawaban card */}
                  <button
                    className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all text-left"
                    onClick={() => {
                      const doc = new jsPDF();
                      const pw = doc.internal.pageSize.getWidth();

                      // Green header
                      doc.setFillColor(16, 185, 129);
                      doc.rect(0, 0, pw, 45, 'F');
                      doc.setTextColor(255, 255, 255);
                      doc.setFontSize(20);
                      doc.setFont('helvetica', 'bold');
                      doc.text(`KUNCI JAWABAN ${mapelLabel.toUpperCase()}`, pw / 2, 22, { align: 'center' });
                      doc.setFontSize(11);
                      doc.setFont('helvetica', 'normal');
                      doc.text(`Paket ${paket} - Tes Kemampuan Akademik`, pw / 2, 34, { align: 'center' });

                      // Table
                      const kunciData = questions.map((q, idx) => [
                        String(idx + 1),
                        q.topik || 'Umum',
                        q.kunci_jawaban || '-',
                      ]);

                      autoTable(doc, {
                        startY: 55,
                        head: [['No', 'Topik', 'Kunci Jawaban']],
                        body: kunciData,
                        margin: { left: 20, right: 20 },
                        styles: { fontSize: 10, cellPadding: 4 },
                        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
                        alternateRowStyles: { fillColor: [240, 253, 244] },
                        columnStyles: {
                          0: { cellWidth: 15, halign: 'center' },
                          2: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
                        },
                      });

                      doc.save(`Kunci_Jawaban_${mapelLabel.replace(/\s/g, '_')}_Paket${paket}.pdf`);
                      setIsPrintModalOpen(false);
                      toast.success('PDF Kunci Jawaban berhasil diunduh!');
                    }}
                  >
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">Kunci Jawaban</p>
                      <p className="text-xs text-slate-400">Download kunci jawaban dalam format PDF</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Answer Key Section ── */}
          {showAnswerKey && (
            <div className="bg-white rounded-[28px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                  <BookText className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-black text-slate-800">Kunci Jawaban</h2>
              </div>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {questions.map((q, idx) => {
                  const studentAns = answers[idx];
                  const correctAns = q.kunci_jawaban || '';
                  let isCorrect = false;

                  if (q.tipe_soal === 'BENAR_SALAH') {
                    const studentMap = (typeof studentAns === 'object' && !Array.isArray(studentAns)) ? studentAns as Record<string, string> : {};
                    const correctParts = correctAns.split(',').map(v => v.trim());
                    let allCorrect = correctParts.length > 0;
                    correctParts.forEach(part => {
                      const [key, val] = part.split(':');
                      if (studentMap[key] !== val) allCorrect = false;
                    });
                    isCorrect = allCorrect;
                  } else if (q.tipe_soal === 'PG_KOMPLEKS') {
                    const studentArr = Array.isArray(studentAns) ? [...studentAns].sort() : [];
                    const correctArr = correctAns.split(',').map(v => v.trim()).sort();
                    isCorrect = studentArr.length > 0 && studentArr.join(',') === correctArr.join(',');
                  } else {
                    isCorrect = studentAns === correctAns;
                  }

                  // Get answer text from options
                  const correctOption = q.opsi_jawaban?.find((o: any) => o.key === correctAns);
                  const correctText = correctOption?.label || correctAns;

                  return (
                    <div
                      key={idx}
                      className={`p-5 rounded-2xl border-2 transition-colors ${isCorrect ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3">
                          <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-black shrink-0 ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                            }`}>
                            {idx + 1}
                          </span>
                          <p className="text-sm text-slate-700 font-medium leading-relaxed pt-1">
                            {q.teks_soal?.substring(0, 120)}{q.teks_soal && q.teks_soal.length > 120 ? '...' : ''}
                          </p>
                        </div>
                        {isCorrect ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-6 h-6 text-rose-500 shrink-0" />
                        )}
                      </div>
                      <div className="ml-11 space-y-1">
                        <p className="text-xs font-bold text-emerald-700">
                          Jawaban benar: {correctText}
                        </p>
                        {!isCorrect && (
                          <p className="text-xs font-bold text-rose-500 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Jawaban Anda salah
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        {/* ═══ Submit Identity Modal ═══ */}
        <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
          <DialogContent className="sm:max-w-[480px] rounded-[24px] border-none p-8 gap-6 shadow-2xl z-[100]">
            <DialogHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-500">
                  <Send className="w-6 h-6" />
                </div>
                <DialogTitle className="text-2xl font-black text-slate-800">Kirim Hasil ke Guru</DialogTitle>
              </div>
              <DialogDescription className="text-slate-500 font-medium leading-relaxed">
                Masukkan kode kelas dan nama lengkapmu untuk mengirim hasil ujian ke guru.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-2">
              {unansweredCount > 0 && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 p-4 rounded-xl">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                  <p className="text-amber-700 text-xs font-bold leading-tight">
                    Perhatian: Masih ada {unansweredCount} soal yang belum Anda jawab!
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Nama Lengkap</Label>
                <input
                  value={namaSiswa}
                  onChange={(e) => setNamaSiswa(e.target.value)}
                  placeholder="Masukkan nama lengkapmu"
                  className="w-full border-2 border-gray-200 bg-gray-50 p-4 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all font-medium text-slate-800 placeholder:text-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Kode Kelas</Label>
                <input
                  value={kodeKelas}
                  onChange={(e) => setKodeKelas(e.target.value.toUpperCase())}
                  placeholder="Contoh: MONO123"
                  className="w-full border-2 border-gray-200 bg-gray-50 p-4 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all font-black text-slate-800 placeholder:text-gray-400 uppercase tracking-wider"
                />
              </div>
            </div>
            <div className="pt-2">
              <Button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className={`w-full h-14 rounded-xl text-white font-bold text-lg shadow-lg transition-all active:scale-[0.98] ${isSubmitting ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"}`}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Mengirim...</span>
                  </div>
                ) : (
                  "Kirim Hasil"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="bg-pink-100 text-pink-600 font-bold px-4 py-1.5 rounded-full text-sm">
                      Soal {currentIndex + 1}
                    </span>
                    <span className="text-gray-500 text-sm ml-3">dari {TOTAL_QUESTIONS}</span>
                  </div>

                  <Button
                    variant="outline"
                    onClick={toggleFlag}
                    className={`flex items-center gap-2 text-gray-600 rounded-lg border transition-all ${flagged.has(currentIndex)
                      ? "bg-amber-50 border-amber-200 text-amber-600"
                      : "border-gray-200 hover:bg-gray-50"
                      }`}
                  >
                    <Flag className={`h-4 w-4 ${flagged.has(currentIndex) ? "fill-current" : ""}`} />
                    Tandai
                  </Button>
                </div>

                {/* Kotak Konteks / Pertanyaan Utama */}
                <div className="space-y-6">
                  {(() => {
                    const questionParts = question.teks_soal.split(/\n\n+/);
                    const contextText = questionParts[0];
                    const coreQuestionText = questionParts.slice(1).join('\n\n');

                    return (
                      <>
                        <div className="bg-blue-50 border border-blue-100 text-gray-800 p-5 rounded-xl text-base leading-relaxed shadow-sm">
                          {question.link_gambar && (
                            <div className="mb-4 bg-white rounded-lg p-2 border border-blue-50/50 shadow-sm overflow-hidden">
                              <img
                                src={question.link_gambar}
                                alt="Ilustrasi Soal"
                                className="w-full max-h-64 object-contain mx-auto"
                              />
                            </div>
                          )}
                          <p className="font-medium">
                            {contextText}
                          </p>
                        </div>

                        {coreQuestionText && (
                          <p className="text-gray-900 font-bold text-lg leading-snug">
                            {coreQuestionText}
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Options List */}
                <div className="space-y-3">
                  {question.tipe_soal === "BENAR_SALAH" ? (
                    question.opsi_jawaban?.map((opt) => {
                      const sMap = (typeof answers[currentIndex] === "object" && !Array.isArray(answers[currentIndex]))
                        ? answers[currentIndex] as Record<string, string>
                        : {};
                      return (
                        <div key={opt.key} className="p-4 mb-3 border border-gray-200 rounded-2xl bg-white shadow-sm transition-all hover:bg-gray-50">
                          <p className="mb-4 text-sm font-bold text-gray-700">{opt.label}</p>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => handleAnswer(currentIndex, `${opt.key}:B`)}
                              className={`flex h-11 items-center justify-center rounded-xl text-sm font-bold transition-all ${sMap[opt.key] === "B"
                                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                              Benar
                            </button>
                            <button
                              onClick={() => handleAnswer(currentIndex, `${opt.key}:S`)}
                              className={`flex h-11 items-center justify-center rounded-xl text-sm font-bold transition-all ${sMap[opt.key] === "S"
                                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                          className={`flex items-center w-full text-left p-4 mb-3 border rounded-2xl cursor-pointer transition-all duration-200 ${isSelected
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mr-4 shrink-0 transition-all ${isSelected
                            ? "bg-blue-500 text-white shadow-md shadow-blue-200"
                            : "bg-gray-100 text-gray-600"
                            }`}>
                            {opt.key}
                          </div>
                          <p className={`text-sm md:text-base font-medium leading-relaxed ${isSelected
                            ? "text-blue-900"
                            : "text-gray-700"
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
        <DialogContent className="sm:max-w-[480px] rounded-[24px] border-none p-8 gap-6 shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isSurvey ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"}`}>
                <Send className="w-6 h-6" />
              </div>
              <DialogTitle className="text-2xl font-black text-slate-800">Kirim Hasil ke Guru</DialogTitle>
            </div>
            <DialogDescription className="text-slate-500 font-medium leading-relaxed">
              Masukkan kode kelas dan nama lengkapmu untuk mengirim hasil {isSurvey ? "survei" : "ujian"} ke guru.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {unansweredCount > 0 && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 p-4 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-amber-700 text-xs font-bold leading-tight">
                  Perhatian: Masih ada {unansweredCount} soal yang belum Anda jawab!
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                Nama Lengkap
              </Label>
              <input
                value={namaSiswa}
                onChange={(e) => setNamaSiswa(e.target.value)}
                placeholder="Masukkan nama lengkapmu"
                className="w-full border-2 border-gray-200 bg-gray-50 p-4 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all font-medium text-slate-800 placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                Kode Kelas
              </Label>
              <input
                value={kodeKelas}
                onChange={(e) => setKodeKelas(e.target.value.toUpperCase())}
                placeholder="Contoh: MONO123"
                className="w-full border-2 border-gray-200 bg-gray-50 p-4 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all font-black text-slate-800 placeholder:text-gray-400 uppercase tracking-wider"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className={`w-full h-14 rounded-xl text-white font-bold text-lg shadow-lg transition-all active:scale-[0.98] ${isSubmitting
                ? "bg-slate-400 cursor-not-allowed"
                : isSurvey
                  ? "bg-rose-500 hover:bg-rose-600 shadow-rose-200"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                }`}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Mengirim...</span>
                </div>
              ) : (
                "Kirim Hasil"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamInterface;
