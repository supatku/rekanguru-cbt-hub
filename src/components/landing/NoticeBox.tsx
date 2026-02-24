import { AlertTriangle } from "lucide-react";

const NoticeBox = () => (
  <div
    className="rounded-xl border border-warning/30 bg-warning/5 p-4 animate-fade-in"
    style={{ animationDelay: "0.7s", opacity: 0 }}
  >
    <div className="flex items-start gap-3">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
      <div>
        <p className="text-sm font-semibold text-foreground">Perhatian!</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Seperti server pada umumnya, server memerlukan waktu untuk menyala
          kembali jika lama tidak digunakan. Silakan tekan tombol{" "}
          <span className="font-semibold text-foreground">Refresh</span> jika
          halaman tidak memuat data.
        </p>
      </div>
    </div>
  </div>
);

export default NoticeBox;
