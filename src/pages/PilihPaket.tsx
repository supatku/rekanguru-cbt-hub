import { useNavigate, useParams } from "react-router-dom";
import { BookOpenCheck, ArrowLeft, RefreshCw } from "lucide-react";
import PacketGrid from "@/components/paket/PacketGrid";
import QuestionTypeInfo from "@/components/paket/QuestionTypeInfo";

const PilihPaket = () => {
  const navigate = useNavigate();
  const { level } = useParams<{ level: string }>();

  const levelLabel = level === "sd" ? "SD / MI" : "SMP / MTs";

  return (
    <div className="min-h-screen bg-surface-subtle">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Kembali</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <BookOpenCheck className="h-4 w-4 text-accent-foreground" />
          </div>
          <span className="text-sm font-bold text-foreground">
            RekanGuru — {levelLabel}
          </span>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        {/* Title */}
        <div className="mb-2 text-center">
          <span className="inline-block rounded-full bg-accent/20 px-4 py-1.5 text-sm font-bold text-accent-foreground animate-fade-in">
            ✨ Pilih Paket Soal ✨
          </span>
        </div>
        <p className="mb-8 text-center text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.1s" }}>
          Setiap paket terdiri dari 30 soal Matematika dan 30 soal Bahasa Indonesia
        </p>

        <PacketGrid level={level || "sd"} />

        <div className="mt-10">
          <QuestionTypeInfo />
        </div>
      </main>
    </div>
  );
};

export default PilihPaket;
