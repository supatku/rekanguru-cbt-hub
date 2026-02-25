import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Key, Eye, EyeOff, ChevronLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const ActivationGate = () => {
    const navigate = useNavigate();
    const { jenjang } = useParams<{ jenjang: string }>();
    const [kode, setKode] = useState("");
    const [showCode, setShowCode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const jenjangNormalized = jenjang?.toLowerCase() || "sd";
    const jenjangUpper = jenjangNormalized.toUpperCase();
    const levelLabel = jenjangNormalized === "sd" ? "SD / MI" : "SMP / MTs";

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!kode.trim()) {
            toast.error("Silakan masukkan kode akses.");
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("tka_lisensi")
                .select("*")
                .eq("kode", kode.trim())
                .eq("jenjang", jenjangUpper)
                .single();

            if (error || !data) {
                toast.error("Kode akses tidak valid atau salah jenjang.");
                return;
            }

            // Validasi Berhasil
            localStorage.setItem("active_license_code", kode.trim());
            toast.success("Aktivasi berhasil! Selamat belajar.");
            navigate(`/dashboard/${jenjangNormalized}`);
        } catch (err: any) {
            toast.error("Terjadi kesalahan sistem. Coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 font-sans">
            <Card className="w-full max-w-md overflow-hidden rounded-[24px] border-none shadow-2xl">
                <CardHeader className="bg-slate-900 pb-12 pt-10 text-center text-white">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                        <Key className="h-7 w-7 text-sky-400" />
                    </div>
                    <CardTitle className="text-2xl font-black tracking-tight">Masukkan Kode Akses</CardTitle>
                    <CardDescription className="mt-2 font-medium text-slate-400 opacity-90">
                        Masukkan kode akses {levelLabel} untuk memulai simulasi
                    </CardDescription>
                </CardHeader>

                <CardContent className="relative -mt-6 rounded-t-[32px] bg-white px-8 pb-10 pt-10">
                    <form onSubmit={handleActivate} className="space-y-6">
                        <div className="space-y-2">
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-sky-500">
                                    <Key className="h-5 w-5" />
                                </div>
                                <Input
                                    type={showCode ? "text" : "password"}
                                    placeholder="KODE AKSES"
                                    value={kode}
                                    onChange={(e) => setKode(e.target.value.toUpperCase())}
                                    className="h-14 border-slate-200 bg-slate-50 pl-12 pr-12 text-center font-black tracking-[0.2em] transition-all focus:ring-2 focus:ring-sky-500/20"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCode(!showCode)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showCode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="h-14 w-full rounded-2xl bg-orange-500 text-lg font-black text-white shadow-xl shadow-orange-200 transition-all hover:bg-orange-600 active:scale-95"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                "Masuk"
                            )}
                        </Button>

                        <div className="rounded-xl bg-sky-50 p-4 text-center">
                            <p className="text-xs font-bold leading-relaxed text-sky-700">
                                Petunjuk: Hubungi guru atau admin untuk mendapatkan kode akses
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="group mx-auto flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-slate-600"
                        >
                            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Kembali pilih jenjang
                        </button>
                    </form>
                </CardContent>
            </Card>

            <footer className="mt-8 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">
                © 2026 Rekan Guru. All rights reserved.
            </footer>
        </div>
    );
};

export default ActivationGate;
