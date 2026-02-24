import { useNavigate } from "react-router-dom";
import { BookOpenCheck, School, UserRound, GraduationCap, RefreshCw, BarChart3, LayoutDashboard, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const testCards = [
  {
    id: "tka",
    icon: School,
    title: "TKA SD/MI",
    subtitle: "Tes Kemampuan Akademik",
    description: "Soal Matematika dan Bahasa Indonesia untuk siswa Sekolah Dasar",
    gradient: "from-sky-500 to-blue-600",
    iconBg: "bg-sky-100 text-sky-600",
  },
  {
    id: "survei_karakter",
    icon: UserRound,
    title: "Survei Karakter",
    subtitle: "Profil Lulusan",
    description: "Mengukur sikap, nilai, keyakinan, dan kebiasaan yang mencerminkan karakter siswa",
    gradient: "from-violet-500 to-purple-600",
    iconBg: "bg-violet-100 text-violet-600",
  },
  {
    id: "sulingjar",
    icon: GraduationCap,
    title: "Survei Lingkungan Belajar",
    subtitle: "Sulingjar",
    description: "Mengukur kualitas berbagai aspek input dan proses belajar-mengajar di sekolah",
    gradient: "from-emerald-500 to-teal-600",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();

  const handleCardClick = (type: string) => {
    switch (type) {
      case "tka":
        navigate("/paket/sd");
        break;
      case "survei_karakter":
        navigate("/exam/sd/survei/karakter?type=survei_karakter");
        break;
      case "sulingjar":
        navigate("/exam/sd/survei/sulingjar?type=sulingjar");
        break;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-subtle">
      {/* ══════ HEADER ══════ */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[hsl(220,70%,15%)] to-[hsl(210,60%,35%)] px-6 pb-16 pt-6 text-white sm:px-10">
        {/* Top bar */}
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--hero-accent))]">
              <BookOpenCheck className="h-5 w-5 text-[hsl(var(--accent-foreground))]" />
            </div>
            <span className="text-lg font-bold">Rekan Guru</span>
          </div>

          <div className="flex items-center gap-2">
            <button className="rounded-lg p-2 opacity-70 transition hover:bg-white/10 hover:opacity-100">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium opacity-80 transition hover:bg-white/10 hover:opacity-100 sm:flex">
              <BarChart3 className="h-4 w-4" />
              Lihat Progres
            </button>
            <button className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium opacity-80 transition hover:bg-white/10 hover:opacity-100 sm:flex">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard Guru
            </button>
          </div>
        </div>

        {/* Hero content */}
        <div className="mx-auto mt-10 max-w-5xl text-center">
          <Badge className="mb-4 bg-white/15 text-white border-white/20 backdrop-blur-sm px-3 py-1 text-xs font-semibold">
            SD/MI
          </Badge>
          <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">
            Pilih jenis tes atau survei yang ingin dikerjakan
          </h1>
        </div>

        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-white/5" />
      </header>

      {/* ══════ CARDS ══════ */}
      <section className="mx-auto -mt-8 w-full max-w-5xl px-4 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {testCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className="group flex flex-col items-start rounded-2xl border border-border bg-background p-6 text-left shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1 animate-fade-in-up"
                style={{ opacity: 0, animationDelay: `${0.1 + idx * 0.1}s` }}
              >
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${card.iconBg} transition-transform group-hover:scale-110`}>
                  <Icon className="h-7 w-7" />
                </div>

                <h3 className="text-lg font-bold text-foreground">{card.title}</h3>
                <p className="mt-0.5 text-sm font-medium text-sky-600">{card.subtitle}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <div className="mx-auto mt-10 mb-10 flex justify-center">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 rounded-full border border-border bg-background px-6 py-2.5 text-sm font-medium text-muted-foreground shadow-sm transition hover:bg-muted"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
