import React, { useState } from "react";
import {
    Heart,
    BookText,
    BarChart3,
    Send,
    Award,
    Target,
    ChevronRight,
    X
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

// --- DUMMY DATA ---
const SUMMARY_DATA = {
    scorePercentage: 93,
    status: "Sangat Baik",
    totalScore: 74,
    maxScore: 80,
};

const DIMENSI_DATA = [
    { name: "Keimanan dan Ketakwaan", score: 67, status: "Cukup", color: "#0d9488" }, // Teal
    { name: "Kewargaan", score: 100, status: "Sangat Baik", color: "#3b82f6" }, // Blue
    { name: "Penalaran Kritis", score: 100, status: "Sangat Baik", color: "#f97316" }, // Orange
    { name: "Kreativitas", score: 100, status: "Sangat Baik", color: "#ef4444" }, // Red
    { name: "Kolaborasi", score: 100, status: "Sangat Baik", color: "#8b5cf6" }, // Purple
    { name: "Kemandirian", score: 100, status: "Sangat Baik", color: "#ec4899" }, // Pink
    { name: "Kesehatan", score: 80, status: "Baik", color: "#06b6d4" }, // Cyan
    { name: "Komunikasi", score: 95, status: "Sangat Baik", color: "#f43f5e" }, // Rose
];

const CharacterResult = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [name, setName] = useState("");
    const [classCode, setClassCode] = useState("");

    const handleSend = () => {
        // Logic for sending results
        console.log("Sending results for:", name, classCode);
        setIsModalOpen(false);
    };

    return (
        <div className="min-h-screen bg-pink-50 pb-32">
            {/* Header Section */}
            <header className="pt-12 pb-8 px-4 text-center">
                <div className="mx-auto w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-200 mb-4 transition-transform hover:scale-110">
                    <Heart className="text-white w-8 h-8 fill-current" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hasil Survei Karakter</h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2">8 Dimensi Profil Lulusan</p>
            </header>

            <main className="max-w-6xl mx-auto px-4 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Left Column: Summary & Chart */}
                    <div className="space-y-8">
                        {/* Score Summary Card */}
                        <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-pink-100/50 border border-pink-50 flex flex-col items-center text-center">
                            <div className="relative mb-4">
                                <span className="text-7xl font-black text-teal-600 tracking-tighter">
                                    {SUMMARY_DATA.scorePercentage}%
                                </span>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-600 hover:bg-emerald-100 border-none font-black px-6 py-2 rounded-full text-sm mb-8">
                                {SUMMARY_DATA.status}
                            </Badge>

                            <div className="grid grid-cols-2 gap-4 w-full">
                                <div className="bg-pink-50 rounded-2xl p-4 flex flex-col items-center">
                                    <Award className="w-5 h-5 text-pink-500 mb-1" />
                                    <span className="text-2xl font-black text-slate-800">{SUMMARY_DATA.totalScore}</span>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Skor</p>
                                </div>
                                <div className="bg-pink-50 rounded-2xl p-4 flex flex-col items-center">
                                    <Target className="w-5 h-5 text-pink-500 mb-1" />
                                    <span className="text-2xl font-black text-slate-800">{SUMMARY_DATA.maxScore}</span>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skor Maksimal</p>
                                </div>
                            </div>
                        </div>

                        {/* Horizontal Bar Chart Card */}
                        <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-pink-100/50 border border-pink-50">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                                    <BarChart3 className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-black text-slate-800">Skor per Dimensi</h2>
                            </div>

                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={DIMENSI_DATA}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                    >
                                        <XAxis type="number" domain={[0, 100]} hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            width={100}
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-slate-900 text-white p-2 rounded-lg text-xs font-bold shadow-xl">
                                                            {payload[0].value}%
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar
                                            dataKey="score"
                                            radius={[0, 10, 10, 0]}
                                            barSize={20}
                                        >
                                            {DIMENSI_DATA.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="flex justify-between items-center mt-4 px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                <span>0</span>
                                <span>25</span>
                                <span>50</span>
                                <span>75</span>
                                <span>100</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Scrollable Detail Dimensi */}
                    <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-pink-100/50 border border-pink-50 flex flex-col max-h-[720px] lg:max-h-none h-full overflow-hidden">
                        <div className="flex items-center gap-3 mb-8 shrink-0">
                            <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-pink-500">
                                <BookText className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-black text-slate-800">Detail Dimensi Karakter</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-hide">
                            {DIMENSI_DATA.map((item, index) => (
                                <div key={index} className="space-y-2 group transition-all duration-300">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-700 group-hover:text-pink-600 transition-colors">
                                            {item.name}
                                        </span>
                                        <span
                                            className="text-xs font-black px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 transition-colors"
                                            style={{ color: item.color }}
                                        >
                                            {item.score}%
                                        </span>
                                    </div>

                                    {/* Custom Progress Bar */}
                                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{
                                                width: `${item.score}%`,
                                                backgroundColor: item.color,
                                                boxShadow: `0 0 10px ${item.color}40`
                                            }}
                                        />
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <div
                                            className="w-1.5 h-1.5 rounded-full"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: item.color }}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer Action Button */}
            <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-pink-100/50 z-40">
                <div className="max-w-6xl mx-auto">
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full h-16 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-pink-200/50 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        <Send className="w-6 h-6 rotate-[-20deg]" />
                        Kirim Hasil ke Guru
                    </Button>
                </div>
            </footer>

            {/* Submission Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md rounded-[32px] border-none p-8 gap-6">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-pink-50 text-pink-500 rounded-lg">
                                <Send className="w-5 h-5" />
                            </div>
                            <DialogTitle className="text-xl font-black text-slate-800">Kirim Hasil ke Guru</DialogTitle>
                        </div>
                        <DialogDescription className="text-slate-500 font-medium">
                            Masukkan kode kelas dan nama lengkapmu untuk mengirim hasil survei ke guru.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-black uppercase text-slate-400 tracking-wider">Nama Lengkap</Label>
                            <Input
                                id="name"
                                placeholder="Masukkan nama lengkapmu"
                                className="h-12 rounded-xl border-slate-200 focus:border-pink-300 focus:ring-pink-100 font-medium"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="classCode" className="text-xs font-black uppercase text-slate-400 tracking-wider">Kode Kelas</Label>
                            <Input
                                id="classCode"
                                placeholder="Contoh: MONO123"
                                className="h-12 rounded-xl border-slate-200 focus:border-pink-300 focus:ring-pink-100 font-medium uppercase"
                                value={classCode}
                                onChange={(e) => setClassCode(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button
                            onClick={handleSend}
                            className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-base transition-all shadow-lg"
                        >
                            Kirim Hasil
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CharacterResult;
