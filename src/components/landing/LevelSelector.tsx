import { School, GraduationCap, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LevelCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
  delay: number;
}

const LevelCard = ({ icon, title, subtitle, onClick, delay }: LevelCardProps) => (
  <button
    onClick={onClick}
    className="group flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 animate-scale-in"
    style={{ animationDelay: `${delay}s`, opacity: 0 }}
  >
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-card-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
  </button>
);

const LevelSelector = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <LevelCard
        icon={<School className="h-6 w-6" />}
        title="SD / MI"
        subtitle="Sekolah Dasar / Madrasah Ibtidaiyah"
        delay={0.4}
        onClick={() => navigate("/dashboard")}
      />
      <LevelCard
        icon={<GraduationCap className="h-6 w-6" />}
        title="SMP / MTs"
        subtitle="Sekolah Menengah Pertama / Madrasah Tsanawiyah"
        delay={0.55}
        onClick={() => navigate("/dashboard")}
      />
    </div>
  );
};

export default LevelSelector;
