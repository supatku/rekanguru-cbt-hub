import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, Lock, Key, Filter, Search, Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface QuestionOption {
    key: string;
    label: string;
}

interface Question {
    id: string;
    jenjang: string;
    mapel: string;
    paket: number;
    tipe: string;
    teks: string;
    image_url: string;
    opsi: QuestionOption[];
    kunci: string;
    created_at: string;
}

const PIN_BENAR = '889900';

const AdminKelolaSoal = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);

    // Filters
    const [filterJenjang, setFilterJenjang] = useState('SD');
    const [filterMapel, setFilterMapel] = useState('Matematika');
    const [filterPaket, setFilterPaket] = useState('1');

    useEffect(() => {
        if (isAuthenticated) {
            fetchSoal();
        }
    }, [isAuthenticated, filterJenjang, filterMapel, filterPaket]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (pinInput === PIN_BENAR) {
            setIsAuthenticated(true);
            toast.success('Akses Dapur Rahasia dibuka!');
        } else {
            toast.error('PIN Salah! Dilarang masuk!');
            setPinInput('');
        }
    };

    const fetchSoal = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tka_bank_soal')
                .select('*')
                .eq('jenjang', filterJenjang)
                .eq('mapel', filterMapel)
                .eq('paket', parseInt(filterPaket))
                .order('created_at', { ascending: false });

            if (error) throw error;
            setQuestions(data || []);
        } catch (error: any) {
            toast.error('Gagal memuat soal: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setEditingQuestion({
            jenjang: filterJenjang,
            mapel: filterMapel,
            paket: parseInt(filterPaket),
            tipe: 'PG_BIASA',
            teks: '',
            image_url: '',
            opsi: [
                { key: 'A', label: '' },
                { key: 'B', label: '' },
                { key: 'C', label: '' },
                { key: 'D', label: '' },
            ],
            kunci: 'A'
        });
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (q: Question) => {
        setEditingQuestion({ ...q });
        setIsDialogOpen(true);
    };

    const handleHapus = async (id: string) => {
        if (!confirm('Yakin ingin menghapus soal ini dari takdir?')) return;

        try {
            const { error } = await supabase
                .from('tka_bank_soal')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Soal berhasil dihapus!');
            fetchSoal();
        } catch (error: any) {
            toast.error('Gagal menghapus: ' + error.message);
        }
    };

    const handleSimpan = async () => {
        if (!editingQuestion) return;

        const { id, ...data } = editingQuestion;

        setLoading(true);
        try {
            let error;
            if (id) {
                ({ error } = await supabase
                    .from('tka_bank_soal')
                    .update(data)
                    .eq('id', id));
            } else {
                ({ error } = await supabase
                    .from('tka_bank_soal')
                    .insert([data]));
            }

            if (error) throw error;
            toast.success(id ? 'Soal diperbarui!' : 'Soal baru ditambahkan!');
            setIsDialogOpen(false);
            fetchSoal();
        } catch (error: any) {
            toast.error('Gagal menyimpan: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const addOption = () => {
        if (!editingQuestion) return;
        const nextKey = String.fromCharCode(65 + (editingQuestion.opsi?.length || 0));
        setEditingQuestion({
            ...editingQuestion,
            opsi: [...(editingQuestion.opsi || []), { key: nextKey, label: '' }]
        });
    };

    const removeOption = (idx: number) => {
        if (!editingQuestion || !editingQuestion.opsi) return;
        const newOptions = editingQuestion.opsi.filter((_, i) => i !== idx);
        setEditingQuestion({ ...editingQuestion, opsi: newOptions });
    };

    const updateOption = (idx: number, val: string) => {
        if (!editingQuestion || !editingQuestion.opsi) return;
        const newOptions = [...editingQuestion.opsi];
        newOptions[idx].label = val;
        setEditingQuestion({ ...editingQuestion, opsi: newOptions });
    };

    if (!isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
                <Card className="w-full max-w-md border-slate-800 bg-slate-950 text-white shadow-2xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-sky-400">
                            <Lock className="h-8 w-8" />
                        </div>
                        <CardTitle className="text-2xl font-black tracking-tight">AREA TERLARANG</CardTitle>
                        <p className="text-sm text-slate-400">Masukkan PIN Dapur Rahasia</p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4 text-slate-800">
                            <Input
                                type="password"
                                placeholder="PIN Keamanan"
                                value={pinInput}
                                onChange={(e) => setPinInput(e.target.value)}
                                className="border-slate-800 bg-slate-900 text-center text-2xl tracking-[0.5em] text-white focus:ring-sky-500"
                                autoFocus
                            />
                            <Button type="submit" className="w-full bg-sky-600 font-bold hover:bg-sky-500">
                                <Key className="mr-2 h-4 w-4" /> Buka Akses
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <header className="sticky top-0 z-30 border-b bg-white px-6 py-4 shadow-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                            <Plus className="h-6 w-6 rotate-45" />
                        </div>
                        <h1 className="text-xl font-black italic tracking-tight text-slate-900">Dapur Rahasia: <span className="text-sky-600">Kelola Bank Soal</span></h1>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsAuthenticated(false)}>
                        <Lock className="mr-2 h-4 w-4" /> Kunci Kembali
                    </Button>
                </div>
            </header>

            <main className="mx-auto mt-8 max-w-7xl px-4 sm:px-6">
                {/* ── FILTER BAR ── */}
                <Card className="mb-8 border-none bg-white shadow-sm">
                    <CardContent className="flex flex-col items-end justify-between gap-4 p-6 md:flex-row md:items-center">
                        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3 md:w-auto">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Jenjang</Label>
                                <Select value={filterJenjang} onValueChange={setFilterJenjang}>
                                    <SelectTrigger className="w-full border-slate-200 sm:w-[150px]">
                                        <SelectValue placeholder="Jenjang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SD">SD / MI</SelectItem>
                                        <SelectItem value="SMP">SMP / MTs</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Mata Pelajaran</Label>
                                <Select value={filterMapel} onValueChange={setFilterMapel}>
                                    <SelectTrigger className="w-full border-slate-200 sm:w-[200px]">
                                        <SelectValue placeholder="Mapel" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Matematika">Matematika</SelectItem>
                                        <SelectItem value="Bahasa Indonesia">Bahasa Indonesia</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Paket</Label>
                                <Select value={filterPaket} onValueChange={setFilterPaket}>
                                    <SelectTrigger className="w-full border-slate-200 sm:w-[100px]">
                                        <SelectValue placeholder="Paket" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                                            <SelectItem key={p} value={p.toString()}>Paket {p}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button onClick={handleOpenAdd} className="bg-sky-600 font-bold hover:bg-sky-500">
                            <Plus className="mr-2 h-5 w-5" /> Tambah Soal Baru
                        </Button>
                    </CardContent>
                </Card>

                {/* ── TABLE ── */}
                <Card className="border-none bg-white shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-bold">Tipe Soal</TableHead>
                                <TableHead className="font-bold">Potongan Teks Soal</TableHead>
                                <TableHead className="text-right font-bold">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-32 text-center text-slate-400">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                                        <p className="mt-2 text-sm">Menghubungkan ke Bank Soal...</p>
                                    </TableCell>
                                </TableRow>
                            ) : questions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-32 text-center text-slate-400">
                                        <Search className="mx-auto mb-2 h-8 w-8 opacity-20" />
                                        <p>Belum ada soal untuk filter ini.</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                questions.map((q) => (
                                    <TableRow key={q.id} className="group transition-colors hover:bg-slate-50">
                                        <TableCell>
                                            <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-black">
                                                {q.tipe}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-md truncate text-sm font-medium text-slate-600">
                                            {q.teks}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenEdit(q)}
                                                    className="h-8 w-8 text-slate-400 hover:bg-white hover:text-sky-600"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleHapus(q.id)}
                                                    className="h-8 w-8 text-slate-400 hover:bg-white hover:text-rose-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </main>

            {/* ── MODAL ADD/EDIT ── */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black italic tracking-tight underline decoration-sky-500 decoration-4">
                            {editingQuestion?.id ? 'Edit Masterpiece' : 'Tambah Soal Baru'}
                        </DialogTitle>
                    </DialogHeader>

                    {editingQuestion && (
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Jenjang</Label>
                                    <Select
                                        value={editingQuestion.jenjang}
                                        onValueChange={(v) => setEditingQuestion({ ...editingQuestion, jenjang: v })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SD">SD / MI</SelectItem>
                                            <SelectItem value="SMP">SMP / MTs</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Mata Pelajaran</Label>
                                    <Select
                                        value={editingQuestion.mapel}
                                        onValueChange={(v) => setEditingQuestion({ ...editingQuestion, mapel: v })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Matematika">Matematika</SelectItem>
                                            <SelectItem value="Bahasa Indonesia">Bahasa Indonesia</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Paket (1-8)</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="8"
                                        value={editingQuestion.paket}
                                        onChange={(e) => setEditingQuestion({ ...editingQuestion, paket: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tipe Soal</Label>
                                    <Select
                                        value={editingQuestion.tipe}
                                        onValueChange={(v) => setEditingQuestion({ ...editingQuestion, tipe: v })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PG_BIASA">PG BIASA</SelectItem>
                                            <SelectItem value="PG_KOMPLEKS">PG KOMPLEKS</SelectItem>
                                            <SelectItem value="BENAR_SALAH">BENAR SALAH</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Teks Soal</Label>
                                <Textarea
                                    rows={4}
                                    placeholder="Ketik pertanyaan di sini..."
                                    value={editingQuestion.teks}
                                    onChange={(e) => setEditingQuestion({ ...editingQuestion, teks: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Link Gambar (Opsional)</Label>
                                <Input
                                    placeholder="https://..."
                                    value={editingQuestion.image_url}
                                    onChange={(e) => setEditingQuestion({ ...editingQuestion, image_url: e.target.value })}
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-lg font-bold">Opsi Jawaban</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addOption}>
                                        <Plus className="mr-2 h-3 w-3" /> Tambah Opsi
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {editingQuestion.opsi?.map((opt, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <div className="flex w-12 items-center justify-center rounded-lg bg-slate-100 font-bold">
                                                {opt.key}
                                            </div>
                                            <Input
                                                placeholder={`Teks opsi ${opt.key}`}
                                                value={opt.label}
                                                onChange={(e) => updateOption(idx, e.target.value)}
                                            />
                                            <Button variant="ghost" size="icon" onClick={() => removeOption(idx)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Kunci Jawaban</Label>
                                <Input
                                    placeholder="Contoh: A (atau A,C untuk kompleks)"
                                    value={editingQuestion.kunci}
                                    onChange={(e) => setEditingQuestion({ ...editingQuestion, kunci: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 border-t pt-4">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={loading}>
                            Batalkan
                        </Button>
                        <Button onClick={handleSimpan} disabled={loading} className="bg-sky-600 font-bold hover:bg-sky-500">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {editingQuestion?.id ? 'Simpan Perubahan' : 'Tanamkan Soal'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminKelolaSoal;
