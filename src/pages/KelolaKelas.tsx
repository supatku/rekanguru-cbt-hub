import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Key, Plus, Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Kelas {
  kode: string;
  guru: string;
}

const defaultKelas: Kelas[] = [
  { kode: "SKS4", guru: "Muhammad Fatwa Maulana" },
];

const KelolaKelas = () => {
  const navigate = useNavigate();
  const [kelasList, setKelasList] = useState<Kelas[]>(defaultKelas);
  const [dialogMode, setDialogMode] = useState<"masuk" | "buat" | null>(null);
  const [inputKode, setInputKode] = useState("");

  const handleMasukKode = () => {
    if (!inputKode.trim()) return;
    navigate(`/dashboard-guru?kelas=${inputKode.trim()}`);
  };

  const handleBuatKelas = () => {
    if (!inputKode.trim()) return;
    const newKelas: Kelas = { kode: inputKode.trim().toUpperCase(), guru: "Guru Baru" };
    setKelasList((prev) => [...prev, newKelas]);
    setDialogMode(null);
    setInputKode("");
  };

  const handleHapusKelas = (kode: string) => {
    setKelasList((prev) => prev.filter((k) => k.kode !== kode));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(175,60%,85%)] to-[hsl(175,50%,92%)]">
      {/* Header */}
      <header className="px-4 pt-6 pb-4 sm:px-8">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 shadow-sm transition hover:bg-white"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Dashboard Guru</h1>
            <p className="text-sm text-muted-foreground">Akses atau buat kelas baru</p>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 shadow-sm transition hover:bg-white">
            <RefreshCw className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-lg space-y-4 px-4 pb-10 sm:px-8">
        {/* Kelas Tersimpan */}
        <p className="text-sm font-semibold text-foreground/80">Kelas Tersimpan:</p>
        {kelasList.map((k) => (
          <div
            key={k.kode}
            onClick={() => navigate(`/dashboard-guru?kelas=${k.kode}`)}
            className="flex cursor-pointer items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="flex-1">
              <p className="text-lg font-bold text-sky-500">{k.kode}</p>
              <p className="text-sm text-muted-foreground">{k.guru}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleHapusKelas(k.kode);
              }}
              className="rounded-lg p-2 text-red-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}

        {/* Masuk dengan Kode Kelas */}
        <button
          onClick={() => { setDialogMode("masuk"); setInputKode(""); }}
          className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500 text-white">
            <Key className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="font-bold text-foreground">Masuk dengan Kode Kelas</p>
            <p className="text-sm text-muted-foreground">Masukkan kode kelas yang sudah ada</p>
          </div>
        </button>

        {/* Buat Kelas Baru */}
        <button
          onClick={() => { setDialogMode("buat"); setInputKode(""); }}
          className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white">
            <Plus className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="font-bold text-foreground">Buat Kelas Baru</p>
            <p className="text-sm text-muted-foreground">Buat kode kelas unik untuk siswa</p>
          </div>
        </button>
      </main>

      {/* Dialog */}
      <Dialog open={dialogMode !== null} onOpenChange={() => setDialogMode(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "masuk" ? "Masuk dengan Kode Kelas" : "Buat Kelas Baru"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "masuk"
                ? "Masukkan kode kelas untuk mengakses dashboard."
                : "Buat kode kelas unik untuk siswa Anda."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder={dialogMode === "masuk" ? "Contoh: SKS4" : "Contoh: MTK6A"}
              value={inputKode}
              onChange={(e) => setInputKode(e.target.value)}
              className="text-center text-lg font-bold tracking-widest uppercase"
            />
            <button
              onClick={dialogMode === "masuk" ? handleMasukKode : handleBuatKelas}
              className="w-full rounded-xl bg-sky-500 py-3 text-sm font-bold text-white transition hover:bg-sky-600"
            >
              {dialogMode === "masuk" ? "Masuk" : "Buat Kelas"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KelolaKelas;
