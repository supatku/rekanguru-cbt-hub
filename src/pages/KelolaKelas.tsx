import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Key, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge"; // Added Badge import

interface Kelas {
  kode: string;
  guru: string;
}

const KelolaKelas = () => {
  const navigate = useNavigate();
  // Initialize from localStorage or empty array
  const [kelasList, setKelasList] = useState<Kelas[]>(() => {
    const saved = localStorage.getItem("kelasList");
    return saved ? JSON.parse(saved) : [];
  });
  const [dialogMode, setDialogMode] = useState<"masuk" | "buat" | null>(null);
  const [inputKode, setInputKode] = useState("");

  const handleMasukKode = () => {
    if (!inputKode.trim()) return;
    navigate(`/dashboard-guru?kelas=${inputKode.trim()}`);
  };

  const handleBuatKelas = () => {
    if (!inputKode.trim()) return;
    const newKelas: Kelas = { kode: inputKode.trim().toUpperCase(), guru: "Guru" };
    const updated = [...kelasList, newKelas];
    setKelasList(updated);
    localStorage.setItem("kelasList", JSON.stringify(updated));
    setDialogMode(null);
    setInputKode("");
  };

  const handleHapusKelas = (kode: string) => {
    const updated = kelasList.filter((k) => k.kode !== kode);
    setKelasList(updated);
    localStorage.setItem("kelasList", JSON.stringify(updated));
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-start p-4 pt-16 selection:bg-[#D4F5C4]"
      style={{ background: 'radial-gradient(ellipse at 60% 30%, #D4F5C4 0%, #FFFFFF 70%)' }}
    >
      {/* Background blobs removed or adjusted to match the radial gradient base if needed, but the user spec says background base + radial gradient */}

      {/* Container */}
      <div className="w-full max-w-lg z-10 space-y-12">
        {/* Header Section */}
        <header className="text-center space-y-6 animate-fade-in-down">
          <h1 className="text-5xl font-black text-[#111111] tracking-tight leading-[1.1] sm:text-6xl">
            Dashboard <span className="text-[#4CAF1A]">Guru</span><br />
            <span className="text-[#111111]">Akses & Kelola</span>
          </h1>
          <p className="max-w-[440px] mx-auto text-lg text-[#4A4A4A] font-medium leading-relaxed opacity-90">
            Akses data hasil ujian & kelola kelas Anda dengan cepat dan mudah.
            Semua data tersimpan aman secara lokal di perangkat Anda.
          </p>
        </header>

        {/* Main Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch justify-center pt-4">
          <button
            onClick={() => { setDialogMode("masuk"); setInputKode(""); }}
            className="flex-1 h-16 flex items-center justify-center gap-3 bg-gradient-to-r from-[#3D8C1F] to-[#4CAF1A] hover:opacity-90 text-white rounded-[20px] font-black text-lg shadow-xl shadow-lime-900/10 transition-all hover:scale-[1.03] active:scale-98 px-8"
          >
            Masuk Kelas Sekarang <ArrowLeft className="h-5 w-5 rotate-180 stroke-[3]" />
          </button>

          <button
            onClick={() => { setDialogMode("buat"); setInputKode(""); }}
            className="h-16 flex items-center justify-center gap-3 bg-[#F6FFF0] border-2 border-dashed border-[#A8D88A] text-[#2D6A2D] rounded-[20px] font-bold text-lg hover:bg-[#E8F5E1] transition-all active:scale-98 px-8"
          >
            <Plus className="h-5 w-5 text-lime-600" /> Buat Kelas Baru
          </button>
        </div>

        {/* Data Cards Section */}
        <div className="pt-10 space-y-8">
          {/* Saved Classes List */}
          {kelasList.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-[#E8F5E1]">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#6B6B6B] text-center">Kelas Tersimpan</p>
              <div className="grid gap-3">
                {kelasList.map((k) => (
                  <div
                    key={k.kode}
                    className="group flex items-center gap-4 bg-white border border-[#E8F5E1] p-5 rounded-[24px] hover:shadow-[0_2px_16px_rgba(0,0,0,0.07)] transition-all"
                  >
                    <div className="h-12 w-12 flex items-center justify-center rounded-[18px] bg-[#E8F5E1] text-[#2D6A2D] font-extrabold text-sm border border-[#E8F5E1] uppercase">
                      {k.kode.slice(0, 2)}
                    </div>
                    <div className="flex-1 cursor-pointer" onClick={() => navigate(`/dashboard-guru?kelas=${k.kode}`)}>
                      <h3 className="text-xl font-black text-[#111111] tracking-tight">{k.kode}</h3>
                      <p className="text-xs font-bold text-[#4A4A4A] uppercase tracking-wide">ID Kelas: {k.kode.toLowerCase()}-id</p>
                    </div>
                    <button
                      onClick={() => handleHapusKelas(k.kode)}
                      className="opacity-0 group-hover:opacity-100 p-3 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center pt-8 border-t border-[#F0FAE8] flex flex-col items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="group flex items-center gap-2 bg-[#F0FAE8] border border-[#C5E8A0] px-4 py-2 rounded-xl text-sm font-bold text-[#2D6A2D] hover:bg-[#E8F5E1] transition-all"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Kembali ke Menu Utama
          </button>
          <p className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-[0.3em]">
            RekanGuru &bull; TKA Simulation Engine &bull; 2026
          </p>
        </footer>
      </div>

      {/* Dialogs */}
      <Dialog open={dialogMode !== null} onOpenChange={() => setDialogMode(null)}>
        <DialogContent className="sm:max-w-md rounded-[40px] border-none shadow-3xl p-10 bg-white selection:bg-[#D4F5C4] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[6px] bg-[#4CAF1A]" />
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-4xl font-black text-[#111111] tracking-tight leading-none">
              {dialogMode === "masuk" ? "Masuk Kelas" : "Baru: Klik di Sini"}
            </DialogTitle>
            <DialogDescription className="text-lg text-[#4A4A4A] font-medium">
              {dialogMode === "masuk"
                ? "Masukkan kode kelas unik untuk mengakses database nilai siswa."
                : "Masukkan nama kelas baru (Misal: KELAS-6A)."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-8 pt-6">
            <div className="relative group">
              <Input
                placeholder={dialogMode === "masuk" ? "KODE KELAS" : "NAMA KELAS"}
                value={inputKode}
                onChange={(e) => setInputKode(e.target.value)}
                className="h-24 text-center text-5xl font-black tracking-[0.2em] bg-[#F6FFF0] border-2 border-transparent border-[#E8F5E1] rounded-[28px] placeholder:text-[#D4F5C4] text-[#111111] focus:bg-white focus:border-[#4CAF1A]/20 focus:ring-0 transition-all uppercase"
              />
              <div className="absolute inset-0 rounded-[28px] ring-4 ring-[#4CAF1A]/5 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
            </div>

            <Button
              onClick={dialogMode === "masuk" ? handleMasukKode : handleBuatKelas}
              className="w-full h-20 rounded-[24px] bg-gradient-to-r from-[#3D8C1F] to-[#4CAF1A] text-white text-xl font-black shadow-2xl shadow-lime-900/20 transition-all hover:scale-[1.02] active:scale-95 border-none"
            >
              {dialogMode === "masuk" ? "Buka Dashboard" : "Konfirmasi & Buat"}
            </Button>

            <p className="text-center text-xs font-bold text-[#6B6B6B] uppercase tracking-widest">
              No Server Needed &bull; Local Access Only
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KelolaKelas;
