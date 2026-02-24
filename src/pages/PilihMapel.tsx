import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Clock, ChevronRight, ClipboardList } from "lucide-react";

const subjects = [
  {
    id: "matematika",
    title: "Tes Kemampuan Akademik Matematika",
    icon: "🔢",
    soal: 30,
    waktu: 60,
    gradient: "from-sky-400 to-blue-500",
    buttonClass: "bg-rose-500 hover:bg-rose-600",
    buttonLabel: "Mulai Matematika",
  },
  {
    id: "bahasa",
    title: "Tes Kemampuan Akademik Membaca",
    icon: "📖",
    soal: 30,
    waktu: 60,
    gradient: "from-pink-400 to-rose-500",
    buttonClass: "bg-amber-400 hover:bg-amber-500",
    buttonLabel: "Mulai B. Indonesia",
  },
  {
    id: "karakter",
    title: "Survei Karakter (Profil Pelajar)",
    icon: "❤️",
    soal: 20,
    waktu: 30,
    gradient: "from-purple-400 to-indigo-500",
    buttonClass: "bg-pink-500 hover:bg-pink-600",
    buttonLabel: "Mulai Survei",
  },
  {
    id: "sulingjar",
    title: "Survei Lingkungan Belajar (Sulingjar)",
    icon: "🏫",
    soal: 20,
    waktu: 30,
    gradient: "from-emerald-400 to-teal-500",
    buttonClass: "bg-sky-500 hover:bg-sky-600",
    buttonLabel: "Mulai Sulingjar",
  },
];

const petunjuk = [
  "Baca setiap soal dengan teliti sebelum menjawab.",
  "Perhatikan jenis soal: Pilihan Ganda Sederhana, Kompleks, atau Kategori.",
  "Untuk soal kompleks, pilih semua jawaban yang benar.",
  "Untuk soal kategori, tentukan Benar/Salah untuk setiap pernyataan.",
  "Anda dapat menggunakan navigasi soal untuk berpindah antar soal.",
];

const PilihMapel = () => {
  const navigate = useNavigate();
  const { level, paket } = useParams<{ level: string; paket: string }>();
  const levelLabel = level === "sd" ? "SD / MI" : "SMP / MTs";

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6">
        <button
          onClick={() => navigate(`/paket/${level}`)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Kembali</span>
        </button>
        <span className="text-sm font-bold text-foreground">
          RekanGuru — {levelLabel}
        </span>
        <div className="w-16" />
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
        {/* Paket badge */}
        <div className="mb-1 text-center">
          <span className="inline-block rounded-full bg-accent/20 px-4 py-1 text-sm font-bold text-accent-foreground animate-fade-in">
            Paket {paket}
          </span>
        </div>

        {/* Title */}
        <div className="mb-2 text-center animate-fade-in" style={{ animationDelay: "0.05s" }}>
          <span className="text-lg font-extrabold text-foreground">
            ✨ Pilih Mata Pelajaran ✨
          </span>
        </div>
        <p className="mb-8 text-center text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.1s" }}>
          Pilih mata pelajaran yang ingin Anda kerjakan
        </p>

        {/* Subject Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {subjects.map((s, i) => (
            <div
              key={s.id}
              className={`group flex flex-col items-center rounded-2xl bg-gradient-to-br ${s.gradient} p-6 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-scale-in`}
              style={{ animationDelay: `${0.15 + i * 0.1}s`, opacity: 0 }}
            >
              <span className="mb-4 text-5xl drop-shadow-md">{s.icon}</span>
              <h2 className="mb-5 text-center text-base font-bold leading-snug sm:text-lg">
                {s.title}
              </h2>

              {/* Info pills */}
              <div className="mb-5 flex w-full flex-col gap-2.5">
                <div className="flex items-center gap-3 rounded-xl bg-white/20 px-4 py-2.5 backdrop-blur-sm">
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-semibold">{s.soal} Soal</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white/20 px-4 py-2.5 backdrop-blur-sm">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-semibold">{s.waktu} Menit</span>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => navigate(`/exam/${level}/${paket}/${s.id}`)}
                className={`flex w-full items-center justify-center gap-1.5 rounded-full ${s.buttonClass} px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200`}
              >
                {s.buttonLabel}
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Petunjuk Umum */}
        <div
          className="mt-8 rounded-2xl border border-border bg-background p-5 shadow-sm animate-fade-in-up"
          style={{ animationDelay: "0.4s", opacity: 0 }}
        >
          <div className="mb-4 flex items-center gap-2 text-foreground">
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-bold">Petunjuk Umum:</span>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {petunjuk.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">{i + 1}.</span> {p}
              </p>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PilihMapel;
