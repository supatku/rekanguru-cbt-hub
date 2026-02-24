import { BookOpen, Calculator, BarChart3, ClipboardList } from "lucide-react";

const features = [
  {
    icon: Calculator,
    label: "Matematika + Bahasa Indonesia",
  },
  {
    icon: BookOpen,
    label: "8 Paket Soal Lengkap",
  },
  {
    icon: ClipboardList,
    label: "Survei Karakter + Sulingjar",
  },
  {
    icon: BarChart3,
    label: "Dashboard Analitik Guru",
  },
];

const FeatureList = () => {
  return (
    <div className="space-y-3">
      {features.map((feature, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg bg-hero-dark/50 border border-hero-dark-muted/20 px-4 py-3 backdrop-blur-sm animate-fade-in-up"
          style={{ animationDelay: `${0.3 + i * 0.1}s`, opacity: 0 }}
        >
          <feature.icon className="h-5 w-5 shrink-0 text-hero-accent" />
          <span className="text-sm font-medium text-hero-dark-foreground">
            {feature.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default FeatureList;
