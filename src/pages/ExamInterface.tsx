import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, RefreshCw, Clock, Flag, BookOpenCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

/* ── Dummy Questions ── */
const dummyQuestions = [
  {
    id: 1,
    text: "Perhatikan gambar berikut! Sebuah persegi panjang dibagi menjadi 10 bagian yang sama besar, dan 4 bagian diwarnai biru. Manakah gambar yang menunjukkan pecahan senilai dengan bagian yang diwarnai?",
    options: [
      { key: "A", label: "Gambar dengan 2 dari 5 bagian diwarnai" },
      { key: "B", label: "Gambar dengan 3 dari 8 bagian diwarnai" },
      { key: "C", label: "Gambar dengan 4 dari 8 bagian diwarnai" },
      { key: "D", label: "Gambar dengan 5 dari 10 bagian diwarnai" },
    ],
    correct: "A",
    imageUrl: "https://via.placeholder.com/600x300.png?text=Gambar+Soal",
  },
  {
    id: 2,
    text: "Hasil dari 3/4 + 1/2 adalah …",
    options: [
      { key: "A", label: "1 1/4" },
      { key: "B", label: "1 1/2" },
      { key: "C", label: "1 3/4" },
      { key: "D", label: "2" },
    ],
    correct: "A",
    imageUrl: "",
  },
  {
    id: 3,
    text: "Sebuah toko menjual 120 buah apel pada hari Senin dan 85 buah apel pada hari Selasa. Berapa total apel yang terjual dalam dua hari?",
    options: [
      { key: "A", label: "195" },
      { key: "B", label: "200" },
      { key: "C", label: "205" },
      { key: "D", label: "215" },
    ],
    correct: "A",
    imageUrl: "",
  },
];

const TOTAL_QUESTIONS = 30;
const INITIAL_SECONDS = 60 * 60; // 60 minutes

const ExamInterface = () => {
  const navigate = useNavigate();
  const { level, paket, mapel } = useParams<{ level: string; paket: string; mapel: string }>();

  const mapelLabel = mapel === "matematika" ? "Matematika" : "B. Indonesia";

  /* ── State ── */
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [seconds, setSeconds] = useState(INITIAL_SECONDS);

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
  const question = dummyQuestions[currentIndex] ?? dummyQuestions[0];

  const selectAnswer = useCallback(
    (val: string) => setAnswers((prev) => ({ ...prev, [currentIndex]: val })),
    [currentIndex],
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

  const handleSubmit = useCallback(() => {
    // Calculate Score
    let correctCount = 0;
    // For dummy purposes, we only have 3 questions with correct keys
    // In a real app, we'd map over all questions
    dummyQuestions.forEach((q, idx) => {
      if (answers[idx] === q.correct) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / dummyQuestions.length) * 100);

    const result = {
      paket: paket || "Unknown",
      mapel: mapelLabel,
      skor: score,
      total_benar: correctCount,
      total_soal: dummyQuestions.length,
      tanggal: Date.now(),
    };

    // Save to localStorage
    const existingProgress = JSON.parse(localStorage.getItem("cbt_student_progress") || "[]");
    const updatedProgress = [result, ...existingProgress];
    localStorage.setItem("cbt_student_progress", JSON.stringify(updatedProgress));

    // Navigate to progress page
    navigate("/student-progress");
  }, [answers, paket, mapelLabel, navigate]);

  /* ── Derived counts ── */
  const answeredCount = Object.keys(answers).length;
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
      <header className="sticky top-0 z-30 flex items-center justify-between bg-primary px-4 py-2.5 text-primary-foreground sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/mapel/${level}/${paket}`)}
            className="flex items-center gap-1.5 text-sm font-medium opacity-80 transition hover:opacity-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Kembali</span>
          </button>

          <div className="hidden h-6 w-px bg-primary-foreground/30 sm:block" />

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <BookOpenCheck className="h-4 w-4 text-accent-foreground" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold">Paket {paket} – {mapelLabel}</p>
              <p className="text-xs opacity-70">Tes Kemampuan Akademik</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="opacity-70 transition hover:opacity-100"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1.5">
            <Clock className="h-4 w-4" />
            <span className="font-mono text-sm font-bold">{formatTime(seconds)}</span>
          </div>

          <Button
            size="sm"
            onClick={handleSubmit}
            className="rounded-full bg-accent text-accent-foreground font-bold hover:bg-accent/90 shadow-md"
          >
            Selesai Ujian
          </Button>
        </div>
      </header>

      {/* ══════ MAIN CONTENT ══════ */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* ── LEFT: Question Area (70%) ── */}
        <main className="flex-1 p-4 sm:p-6 lg:w-[70%]">
          <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-background p-5 shadow-sm sm:p-8">
            {/* Header row */}
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-accent text-accent-foreground font-bold px-3 py-1">
                  Soal {currentIndex + 1}
                </Badge>
                <span className="text-sm text-muted-foreground">dari {TOTAL_QUESTIONS}</span>
              </div>
              <button
                onClick={toggleFlag}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${flagged.has(currentIndex)
                  ? "bg-amber-100 text-amber-700"
                  : "text-muted-foreground hover:bg-muted"
                  }`}
              >
                <Flag className="h-4 w-4" />
                Tandai
              </button>
            </div>

            {/* Illustration placeholder */}
            {question.imageUrl && (
              <div className="mb-5 flex justify-center overflow-hidden rounded-xl border border-border bg-muted/20">
                <img
                  src={question.imageUrl}
                  alt="Ilustrasi Soal"
                  className="max-h-64 w-auto object-contain p-2"
                />
              </div>
            )}

            {/* Question text */}
            <p className="mb-6 text-sm leading-relaxed text-foreground sm:text-base">
              {question.text}
            </p>

            {/* Options */}
            <RadioGroup
              value={answers[currentIndex] ?? ""}
              onValueChange={selectAnswer}
              className="space-y-3"
            >
              {question.options.map((opt) => {
                const selected = answers[currentIndex] === opt.key;
                return (
                  <label
                    key={opt.key}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 transition ${selected
                      ? "border-sky-400 bg-sky-50"
                      : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
                      }`}
                  >
                    <RadioGroupItem value={opt.key} id={`opt-${opt.key}`} />
                    <span className="text-sm font-medium text-foreground">
                      {opt.key}. {opt.label}
                    </span>
                  </label>
                );
              })}
            </RadioGroup>

            {/* Bottom navigation */}
            <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
              <Button
                variant="outline"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => i - 1)}
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Sebelumnya
              </Button>

              <span className="text-sm font-medium text-muted-foreground">
                {currentIndex + 1} / {TOTAL_QUESTIONS}
              </span>

              <Button
                disabled={currentIndex === TOTAL_QUESTIONS - 1}
                onClick={() => setCurrentIndex((i) => i + 1)}
                className="gap-1.5"
              >
                Selanjutnya
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </main>

        {/* ── RIGHT: Sidebar (30%) ── */}
        <aside className="w-full border-t border-border bg-background p-4 sm:p-6 lg:w-[30%] lg:border-l lg:border-t-0">
          <h3 className="mb-4 text-base font-bold text-foreground">Navigasi Soal</h3>

          {/* Legend */}
          <div className="mb-4 grid grid-cols-2 gap-2 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-sky-500" /> Aktif
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" /> Terjawab
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-amber-400" /> Ditandai
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-muted" /> Belum
            </div>
          </div>

          {/* Number grid */}
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: TOTAL_QUESTIONS }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`flex h-10 w-full items-center justify-center rounded-lg text-sm font-bold transition ${getNavColor(idx)}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 space-y-2 rounded-xl border border-border p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Terjawab</span>
              <span className="font-bold text-emerald-600">{answeredCount} soal</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Belum dijawab</span>
              <span className="font-bold text-rose-500">{unansweredCount} soal</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ditandai</span>
              <span className="font-bold text-amber-500">{flaggedCount} soal</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ExamInterface;
