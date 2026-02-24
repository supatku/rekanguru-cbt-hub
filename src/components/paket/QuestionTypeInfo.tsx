const types = [
  {
    emoji: "📝",
    bgColor: "bg-sky-100",
    title: "Pilihan Ganda Sederhana",
    desc: "Satu jawaban benar dari 4 pilihan",
  },
  {
    emoji: "✅",
    bgColor: "bg-emerald-100",
    title: "Pilihan Ganda Kompleks",
    desc: "Lebih dari satu jawaban benar",
  },
  {
    emoji: "⚖️",
    bgColor: "bg-amber-100",
    title: "Model Kategori",
    desc: "Respons Benar/Salah per pernyataan",
  },
];

const QuestionTypeInfo = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {types.map((t, i) => (
        <div
          key={i}
          className="flex flex-col items-center rounded-2xl bg-background p-6 shadow-sm border border-border text-center animate-fade-in-up"
          style={{ animationDelay: `${0.6 + i * 0.1}s`, opacity: 0 }}
        >
          <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-xl ${t.bgColor}`}>
            <span className="text-2xl">{t.emoji}</span>
          </div>
          <p className="mb-1 text-sm font-bold text-foreground">{t.title}</p>
          <p className="text-xs text-muted-foreground">{t.desc}</p>
        </div>
      ))}
    </div>
  );
};

export default QuestionTypeInfo;
