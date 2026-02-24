import { useNavigate } from "react-router-dom";
import { ChevronRight, Calculator, BookOpen } from "lucide-react";

interface PacketCardProps {
  index: number;
  gradient: string;
  buttonColor: string;
  emoji: string;
  level: string;
}

const packets: { gradient: string; buttonColor: string; emoji: string }[] = [
  { gradient: "from-cyan-400 to-blue-500", buttonColor: "bg-rose-400 hover:bg-rose-500", emoji: "📚" },
  { gradient: "from-blue-400 to-indigo-500", buttonColor: "bg-amber-400 hover:bg-amber-500", emoji: "✏️" },
  { gradient: "from-pink-400 to-rose-500", buttonColor: "bg-rose-500 hover:bg-rose-600", emoji: "🎯" },
  { gradient: "from-emerald-400 to-teal-500", buttonColor: "bg-blue-500 hover:bg-blue-600", emoji: "🏆" },
  { gradient: "from-indigo-400 to-purple-500", buttonColor: "bg-rose-400 hover:bg-rose-500", emoji: "⭐" },
  { gradient: "from-rose-400 to-pink-500", buttonColor: "bg-purple-500 hover:bg-purple-600", emoji: "💡" },
  { gradient: "from-purple-400 to-violet-500", buttonColor: "bg-amber-400 hover:bg-amber-500", emoji: "🚀" },
  { gradient: "from-teal-400 to-cyan-500", buttonColor: "bg-rose-400 hover:bg-rose-500", emoji: "🌟" },
];

const PacketCard = ({ index, gradient, buttonColor, emoji, level }: PacketCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      className={`group relative flex flex-col items-center overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-scale-in`}
      style={{ animationDelay: `${0.05 + index * 0.06}s`, opacity: 0 }}
    >
      {/* Emoji icon */}
      <span className="mb-3 text-4xl drop-shadow-md">{emoji}</span>

      {/* Subject info */}
      <div className="mb-4 flex items-center gap-4 text-xs font-medium text-white/90">
        <span className="flex items-center gap-1">
          <Calculator className="h-3.5 w-3.5" />
          30 MTK
        </span>
        <span className="flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" />
          30 B.Indo
        </span>
      </div>

      {/* CTA Button */}
      <button
        onClick={() => navigate(`/mapel/${level}/${index + 1}`)}
        className={`flex w-full items-center justify-center gap-1 rounded-full ${buttonColor} px-4 py-2 text-sm font-bold text-white shadow-md transition-all duration-200`}
      >
        Paket {index + 1}
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
};

const PacketGrid = ({ level }: { level: string }) => {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
      {packets.map((p, i) => (
        <PacketCard key={i} index={i} level={level} {...p} />
      ))}
    </div>
  );
};

export default PacketGrid;
