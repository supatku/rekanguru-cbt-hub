import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  LayoutPanelLeft,
  Info,
  Loader2,
  FileQuestion,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
}

const ExamInterface = () => {
  const navigate = useNavigate();
  const { level, paket, mapel } = useParams<{ level: string; paket: string; mapel: string }>();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[] | Record<string, string>>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [seconds, setSeconds] = useState(3600); // 60 mins

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
      const { data, error } = await supabase
        .from('tka_bank_soal')
        .select('*')
        .eq('jenjang', level?.toUpperCase())
        .eq('paket_ke', parseInt(paket || '1'))
        .eq('mapel', mapelLabel);

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
          // Expected val format: "key:value" (e.g. "A:B")
          const [key, bOrS] = val.split(":");
          const currentMap = (typeof currentAnswer === "object" && !Array.isArray(currentAnswer))
            ? { ...currentAnswer }
            : {} as Record<string, string>;

          currentMap[key] = bOrS;
          return { ...prev, [qIndex]: currentMap };
        } else if (isComplex) {
          // PGK: Toggle in array
          const currentArr = Array.isArray(currentAnswer) ? currentAnswer : [];
          if (currentArr.includes(val)) {
            const nextArr = currentArr.filter(v => v !== val);
            return { ...prev, [qIndex]: nextArr.length > 0 ? nextArr : [] };
          } else {
            return { ...prev, [qIndex]: [...currentArr, val] };
          }
        } else {
          // PG Biasa: Overwrite string
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
    // Calculate Score
    let correctCount = 0;
    questions.forEach((q, idx) => {
      const studentAns = answers[idx];
      const correctAns = q.kunci_jawaban || "";

      if (q.tipe_soal === "BENAR_SALAH") {
        // Correct format: "A:B,B:S,C:B"
        const studentMap = (typeof studentAns === "object" && !Array.isArray(studentAns)) ? studentAns as Record<string, string> : {};
        const correctParts = correctAns.split(",").map(v => v.trim());

        let allCorrect = correctParts.length > 0;
        correctParts.forEach(part => {
          const [key, val] = part.split(":");
          if (studentMap[key] !== val) allCorrect = false;
        });

        if (allCorrect) correctCount++;
      } else if (q.tipe_soal === "PG_KOMPLEKS") {
        // Compare arrays (normalized)
        const studentArr = Array.isArray(studentAns) ? [...studentAns].sort() : [];
        const correctArr = correctAns.split(",").map(v => v.trim()).sort();

        if (studentArr.length > 0 && studentArr.join(",") === correctArr.join(",")) {
          correctCount++;
        }
      } else {
        // Simple string comparison
        if (studentAns === correctAns) {
          correctCount++;
        }
      }
    });

    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    const result = {
      paket: paket || "Unknown",
      mapel: mapelLabel,
      skor: score,
      total_benar: correctCount,
      total_soal: questions.length,
      tanggal: Date.now(),
    };

    // Save to localStorage
    const existingProgress = JSON.parse(localStorage.getItem("cbt_student_progress") || "[]");
    const updatedProgress = [result, ...existingProgress];
    localStorage.setItem("cbt_student_progress", JSON.stringify(updatedProgress));

    // Navigate to progress page
    navigate("/student-progress");
  }, [answers, paket, mapelLabel, navigate, questions]);

  /* ── Derived counts ── */
  const answeredCount = useMemo(() => {
    return Object.entries(answers).filter(([idx, a]) => {
      const q = questions[parseInt(idx)];
      if (!q) return false;

      if (q.tipe_soal === "BENAR_SALAH") {
        const studentMap = (typeof a === "object" && !Array.isArray(a)) ? a as Record<string, string> : {};
        // Strict: Must answer ALL statements
        return q.opsi_jawaban?.length > 0 && Object.keys(studentMap).length === q.opsi_jawaban.length;
      }
      if (Array.isArray(a)) return a.length > 0;
      return a !== undefined && a !== "";
    }).length;
  }, [answers, questions]);

  const flaggedCount = flagged.size;
  const unansweredCount = TOTAL_QUESTIONS - answeredCount;

  /* ── Nav button color helper ── */
  const getNavColor = (idx: number) => {
    if (idx === currentIndex) return "bg-sky-500 text-white";
    if (answers[idx] !== undefined) return "bg-emerald-500 text-white";
    if (flagged.has(idx)) return "bg-amber-400 text-white";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-subtle">
      {/* ══════ TOP NAVBAR ══════ */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-primary px-3 py-2 text-primary-foreground sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate(`/mapel/${level}/${paket}`)}
            className="flex items-center gap-1 text-sm font-medium opacity-80 transition hover:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden md:inline">Kembali</span>
          </button>

          <div className="hidden h-6 w-px bg-primary-foreground/30 sm:block" />

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent sm:h-8 sm:w-8">
              <LayoutPanelLeft className="h-4 w-4 text-accent-foreground" />
            </div>
            <div className="leading-tight">
              <p className="text-xs font-bold sm:text-sm">Paket {paket} – {mapelLabel}</p>
              <p className="hidden text-[10px] opacity-70 sm:block">Tes Kemampuan Akademik</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.location.reload()}
                  className="hidden h-8 w-8 opacity-70 transition hover:opacity-100 sm:flex"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Informasi Ujian</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex items-center gap-1 rounded-full bg-primary-foreground/10 px-2 py-1 sm:px-3 sm:py-1.5">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="font-mono text-xs font-bold sm:text-sm">{formatTime(seconds)}</span>
          </div>

          <Button
            size="sm"
            onClick={handleSubmit}
            className="h-8 rounded-full bg-accent px-3 text-[10px] font-bold text-accent-foreground hover:bg-accent/90 sm:h-9 sm:px-4 sm:text-xs shadow-md"
          >
            Selesai Ujian
          </Button>
        </div>
      </header>

      {/* ══════ MAIN CONTENT ══════ */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* ── LEFT: Question Area (70%) ── */}
        <main className="flex-1 p-4 sm:p-6 lg:w-[70%]">
          {isLoading ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white shadow-sm">
              <Loader2 className="h-10 w-10 animate-spin text-sky-500" />
              <p className="mt-4 font-medium text-slate-500">Memuat soal dari bank...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-rose-200 bg-white shadow-sm">
              <FileQuestion className="h-12 w-12 text-rose-300" />
              <h3 className="mt-4 text-lg font-bold text-slate-800">Soal Belum Tersedia</h3>
              <p className="text-slate-500">Maaf, paket soal ini belum tersedia di bank soal.</p>
              <Button onClick={() => navigate("/dashboard")} variant="outline" className="mt-6">Kembali ke Dashboard</Button>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-background p-5 shadow-sm sm:p-8">
              {/* Header row */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5 text-orange-600">
                    <span className="text-sm font-black">Soal {currentIndex + 1}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-400">dari {TOTAL_QUESTIONS}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFlag}
                  className={`flex h-9 items-center gap-2 rounded-lg border-slate-200 px-4 text-sm font-semibold transition-all ${flagged.has(currentIndex)
                    ? "bg-amber-100 text-amber-700 border-amber-200"
                    : "text-slate-500 hover:bg-slate-50"
                    }`}
                >
                  <Flag className={`h-4 w-4 ${flagged.has(currentIndex) ? "fill-current" : ""}`} />
                  Tandai
                </Button>
              </div>

              {/* Illustration */}
              {question.link_gambar && (
                <div className="mb-6 flex justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50">
                  <img
                    src={question.link_gambar}
                    alt="Ilustrasi Soal"
                    className="max-h-72 w-auto object-contain p-4"
                  />
                </div>
              )}

              {/* Question Text with Bacaan Box Heuristic */}
              {(() => {
                const parts = question.teks_soal.split("\n\n");
                const hasBacaan = parts.length > 1;
                const bacaanText = hasBacaan ? parts[0] : "";
                const mainQuestion = hasBacaan ? parts.slice(1).join("\n\n") : question.teks_soal;

                return (
                  <div className="space-y-6">
                    {hasBacaan && (
                      <div className="relative overflow-hidden rounded-r-2xl border-l-4 border-sky-500 bg-slate-50/80 p-5 shadow-sm">
                        <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-sky-600">Bacaan:</span>
                        <p className="text-justify text-sm leading-relaxed text-slate-700 sm:text-base whitespace-pre-line">
                          {bacaanText}
                        </p>
                      </div>
                    )}
                    <p className="text-justify text-sm font-bold leading-relaxed text-slate-900 sm:text-lg">
                      {mainQuestion}
                    </p>

                    {/* PGK Tip */}
                    {question.tipe_soal === "PG_KOMPLEKS" && (
                      <p className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 animate-pulse">
                        <span className="flex h-2 w-2 rounded-full bg-amber-500" />
                        (Pilih lebih dari satu jawaban yang benar)
                      </p>
                    )}

                    {/* Benar/Salah Tip */}
                    {question.tipe_soal === "BENAR_SALAH" && (
                      <p className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                        <span className="flex h-2 w-2 rounded-full bg-sky-500" />
                        (Tentukan Benar atau Salah untuk setiap pernyataan)
                      </p>
                    )}
                  </div>
                );
              })()}

              <div className="h-8" /> {/* Spacer */}

              {/* Options Section */}
              <div className="grid gap-6">
                {question.tipe_soal === "BENAR_SALAH" ? (
                  /* ── BENAR / SALAH LAYOUT ── */
                  <div className="space-y-4">
                    {question.opsi_jawaban?.map((opt) => {
                      const studentMap = (typeof answers[currentIndex] === "object" && !Array.isArray(answers[currentIndex]))
                        ? answers[currentIndex] as Record<string, string>
                        : {};
                      const selectedVal = studentMap[opt.key];

                      return (
                        <div key={opt.key} className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                          <p className="mb-4 text-sm font-bold text-slate-700">{opt.label}</p>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => handleAnswer(currentIndex, `${opt.key}:B`)}
                              className={`flex h-12 items-center justify-center rounded-xl border-2 font-bold transition-all ${selectedVal === "B"
                                  ? "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                                  : "border-slate-50 bg-slate-50 text-slate-400 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                                }`}
                            >
                              Benar
                            </button>
                            <button
                              onClick={() => handleAnswer(currentIndex, `${opt.key}:S`)}
                              className={`flex h-12 items-center justify-center rounded-xl border-2 font-bold transition-all ${selectedVal === "S"
                                  ? "border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-200"
                                  : "border-slate-50 bg-slate-50 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                }`}
                            >
                              Salah
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* ── PG BIASA & PG KOMPLEKS LAYOUT ── */
                  <div className="grid gap-4">
                    {question.opsi_jawaban?.map((option) => {
                      const isComplex = question.tipe_soal === "PG_KOMPLEKS";
                      const currentAns = answers[currentIndex];
                      const isSelected = isComplex
                        ? (Array.isArray(currentAns) && currentAns.includes(option.key))
                        : currentAns === option.key;

                      return (
                        <Label
                          key={option.key}
                          onClick={() => handleAnswer(currentIndex, option.key)}
                          className={`group relative flex cursor-pointer items-center rounded-2xl border-2 p-5 transition-all duration-300 ${isSelected
                            ? "border-sky-500 bg-sky-50/30 shadow-md scale-[1.01]"
                            : "border-slate-100 bg-white hover:border-sky-200 hover:shadow-sm"
                            }`}
                        >
                          {/* Decorative Vertical Capsule */}
                          <div className={`mr-4 flex h-10 w-4 items-center justify-center transition-all duration-300 ${isComplex ? "rounded-lg" : "rounded-full"} border-2 ${isSelected
                            ? "border-sky-500 bg-sky-500"
                            : "border-sky-400 bg-transparent"
                            }`} />

                          <div className="flex flex-1 items-center gap-2">
                            <span className={`text-base font-bold transition-colors duration-300 ${isSelected ? "text-sky-700" : "text-slate-600"
                              }`}>
                              {option.key}. {option.label}
                            </span>
                          </div>

                          {/* Selection indicator (Radio vs Checkbox icon) */}
                          {isSelected && (
                            <div className={`flex h-6 w-6 items-center justify-center bg-sky-500 text-white shadow-sm transition-all ${isComplex ? "rounded-md" : "rounded-full"}`}>
                              <div className={isComplex ? "h-2 w-2 border-b-2 border-r-2 border-white rotate-45 mb-0.5" : "h-1.5 w-1.5 rounded-full bg-white"} />
                            </div>
                          )}
                        </Label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="mt-12 flex items-center justify-between gap-6">
                <Button
                  variant="outline"
                  onClick={goPrev}
                  disabled={currentIndex === 0}
                  className="h-12 w-32 rounded-full border-2 border-slate-200 bg-white px-6 font-bold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-md disabled:opacity-30"
                >
                  <ChevronLeft className="mr-2 h-5 w-5" />
                  Sebelum
                </Button>

                <Button
                  onClick={goNext}
                  disabled={currentIndex === TOTAL_QUESTIONS - 1}
                  className="h-12 w-32 rounded-full bg-slate-500 px-6 font-bold text-white transition-all hover:bg-slate-600 hover:shadow-lg disabled:opacity-30"
                >
                  Sesudah
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </main>

        {/* ── RIGHT: Sidebar (30%) ── */}
        <aside className="w-full border-t border-border bg-background p-4 sm:p-6 lg:w-[30%] lg:border-l lg:border-t-0">
          <h3 className="mb-6 text-xl font-bold text-slate-800">Navigasi Soal</h3>

          {/* Legend */}
          <div className="mb-8 grid grid-cols-2 gap-y-3 text-sm font-medium text-slate-600">
            <div className="flex items-center gap-2.5">
              <span className="h-4 w-4 rounded-[4px] bg-sky-500" /> Aktif
            </div>
            <div className="flex items-center gap-2.5">
              <span className="h-4 w-4 rounded-[4px] bg-emerald-500" /> Terjawab
            </div>
            <div className="flex items-center gap-2.5">
              <span className="h-4 w-4 rounded-[4px] bg-amber-500" /> Ditandai
            </div>
            <div className="flex items-center gap-2.5">
              <span className="h-4 w-4 rounded-[4px] bg-slate-200" /> Belum
            </div>
          </div>

          {/* Number grid */}
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: TOTAL_QUESTIONS }).map((_, idx) => {
              const studentAns = answers[idx];
              const q = questions[idx];

              let isAnswered = false;
              if (q?.tipe_soal === "BENAR_SALAH") {
                const sMap = (typeof studentAns === "object" && !Array.isArray(studentAns)) ? studentAns as Record<string, string> : {};
                isAnswered = q.opsi_jawaban?.length > 0 && Object.keys(sMap).length === q.opsi_jawaban.length;
              } else if (Array.isArray(studentAns)) {
                isAnswered = studentAns.length > 0;
              } else {
                isAnswered = studentAns !== undefined && studentAns !== "";
              }

              const isCurrent = idx === currentIndex;
              const isFlagged = flagged.has(idx);

              let bgColor = "bg-[#DEE7F0] text-slate-600"; // Light Sea Blue / Greyish Blue from screenshot
              if (isAnswered) bgColor = "bg-emerald-500 text-white";
              else if (isFlagged) bgColor = "bg-amber-500 text-white";
              if (isCurrent) bgColor = "bg-sky-500 text-white";

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold transition-all duration-200 ${bgColor} ${isCurrent ? "shadow-sm scale-105" : "hover:bg-slate-200"
                    }`}
                >
                  {/* Outer glow ring for active state */}
                  {isCurrent && (
                    <div className="absolute inset-[-4px] rounded-lg border-2 border-sky-500 opacity-90" />
                  )}
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Summary Card */}
          <div className="mt-20 space-y-4 rounded-3xl bg-slate-50/80 p-6">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-slate-500">Terjawab</span>
              <span className="text-base font-bold text-emerald-500">{answeredCount} soal</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-slate-500">Belum dijawab</span>
              <span className="text-base font-bold text-rose-500">{unansweredCount} soal</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-slate-500">Ditandai</span>
              <span className="text-base font-bold text-amber-500">{flaggedCount} soal</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ExamInterface;
