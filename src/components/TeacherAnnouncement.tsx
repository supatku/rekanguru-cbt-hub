import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Megaphone, X, Sparkles, BellRing } from "lucide-react";

const SESSION_KEY = "announcement_closed";

/**
 * Premium System Announcement Modal
 * Built with high-end aesthetics: Glassmorphism, Floating animations, and sophisticated typography.
 * Designed by "Architect-level" standards for maximum impact and readability.
 */
const TeacherAnnouncement = () => {
    const [text, setText] = useState("");
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (sessionStorage.getItem(SESSION_KEY) === "true") return;

        let cancelled = false;

        const load = async () => {
            try {
                const { data, error } = await supabase
                    .from("app_settings")
                    .select("is_announcement_active, announcement_text")
                    .eq("id", 1)
                    .maybeSingle();

                if (error || cancelled) return;

                if (data?.is_announcement_active && data.announcement_text?.trim()) {
                    setText(data.announcement_text);
                    setVisible(true);
                }
            } catch {
                // Silently degrade
            }
        };

        load();
        return () => { cancelled = true; };
    }, []);

    const dismiss = useCallback(() => {
        setVisible(false);
        sessionStorage.setItem(SESSION_KEY, "true");
    }, []);

    if (!visible) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden"
            role="dialog"
            aria-modal="true"
        >
            {/* Dynamic Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl transition-opacity animate-[fadeIn_0.5s_ease-out]"
                onClick={dismiss}
            />

            {/* Animated Blobs for Atmosphere */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-amber-400/20 blur-[130px] rounded-full animate-[blobFloat_20s_infinite_linear]" />
                <div className="absolute top-[60%] -right-[10%] w-[35%] h-[35%] bg-sky-400/20 blur-[110px] rounded-full animate-[blobFloat_15s_infinite_linear_reverse]" />
            </div>

            {/* Main Modal Container */}
            <div
                className="relative w-full max-w-xl overflow-hidden rounded-[48px] border border-white/40 bg-white/70 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.3)] backdrop-blur-2xl animate-[modalEnter_0.7s_cubic-bezier(0.34,1.56,0.64,1)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top Accent Bar */}
                <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-sky-400" />

                {/* Close Button - Premium Glass Style */}
                <button
                    onClick={dismiss}
                    className="absolute right-8 top-8 z-10 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/50 bg-white/20 text-slate-500 backdrop-blur-md transition-all hover:bg-white/40 hover:text-slate-800 hover:rotate-90 active:scale-90"
                >
                    <X className="h-6 w-6" />
                </button>

                <div className="p-10 pt-14 sm:p-14 sm:pt-16">
                    {/* Hero Icon Section */}
                    <div className="relative mx-auto mb-10 flex h-28 w-28 items-center justify-center">
                        {/* Animated Wings/Rings */}
                        <div className="absolute inset-0 animate-ping rounded-full bg-amber-400/15 duration-[4000ms]" />
                        <div className="absolute inset-2 animate-ping rounded-full bg-amber-400/25 duration-[3000ms] delay-700" />

                        <div className="relative flex h-full w-full items-center justify-center rounded-[36px] bg-gradient-to-br from-amber-400/90 to-orange-500/95 text-white shadow-[0_24px_50px_-12px_rgba(245,158,11,0.45)]">
                            <Megaphone className="h-12 w-12 animate-[wiggle_2.5s_infinite]" />
                            <Sparkles className="absolute -top-3 -right-3 h-8 w-8 text-amber-300 animate-pulse" />
                        </div>
                    </div>

                    {/* Header Typography */}
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl font-black tracking-tight text-slate-900 flex flex-wrap items-center justify-center gap-4">
                            <BellRing className="h-8 w-8 text-amber-500" />
                            PENGUMUMAN
                        </h2>
                        <div className="flex items-center justify-center gap-3">
                            <span className="h-px w-10 bg-slate-200" />
                            <span className="text-[12px] font-black uppercase tracking-[0.5em] text-amber-600/80">Protocol & Information</span>
                            <span className="h-px w-10 bg-slate-200" />
                        </div>
                    </div>

                    {/* Content Area - Architect-Grade Typography */}
                    <div className="mt-10 relative group">
                        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="relative max-h-80 overflow-y-auto rounded-[32px] border border-white/60 bg-white/40 p-10 shadow-[inset_0_4px_24px_rgba(0,0,0,0.02)] backdrop-blur-sm custom-scrollbar">
                            <div className="whitespace-pre-wrap text-justify [text-align-last:left] break-words hyphens-auto selection:bg-amber-200/50 text-[18px] font-medium leading-[1.85] text-slate-700 tracking-tight italic">
                                {text}
                            </div>

                            {/* Decorative Architect Lines */}
                            <div className="mt-8 pt-6 border-t border-slate-100/50 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                                <div className="flex gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                    End of Message
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* CTA - Shiny Glow Effect */}
                    <div className="mt-12">
                        <button
                            onClick={dismiss}
                            className="group relative w-full overflow-hidden rounded-[30px] bg-slate-950 py-6 text-xl font-black text-white shadow-[0_24px_60px_-15px_rgba(0,0,0,0.5)] transition-all hover:scale-[1.02] hover:shadow-[0_30px_70px_-10px_rgba(0,0,0,0.6)] active:scale-[0.97]"
                        >
                            {/* Shine Animation */}
                            <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-20deg)_translateX(-100%)] group-hover:animate-[shine_0.8s_ease-in-out_infinite]">
                                <div className="relative h-full w-20 bg-white/20" />
                            </div>

                            <span className="relative flex items-center justify-center gap-3 tracking-[0.1em]">
                                SAYA MENGERTI <span className="text-3xl animate-bounce">👍</span>
                            </span>
                        </button>

                        <div className="mt-6 flex items-center justify-center gap-5 text-slate-300">
                            <span className="h-px flex-1 bg-slate-100" />
                            <p className="text-[10px] font-black uppercase tracking-[0.6em] whitespace-nowrap text-slate-400">
                                COMPLIANCE v4.2.0
                            </p>
                            <span className="h-px flex-1 bg-slate-100" />
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes modalEnter {
                    from { opacity: 0; transform: translateY(80px) rotateX(20deg) scale(0.92); filter: blur(25px); }
                    to { opacity: 1; transform: translateY(0) rotateX(0) scale(1); filter: blur(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes blobFloat {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    33% { transform: translate(12%, 18%) scale(1.1); rotate: 8deg; }
                    66% { transform: translate(-10%, 12%) scale(0.9) rotate(-8deg); }
                    100% { transform: translate(0, 0) scale(1) rotate(0deg); }
                }
                @keyframes wiggle {
                    0%, 100% { transform: rotate(-7deg) scale(1); }
                    50% { transform: rotate(7deg) scale(1.08); }
                }
                @keyframes shine {
                    to { transform: skew(-20deg) translateX(300%); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 7px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.06);
                    border-radius: 20px;
                    border: 2px solid transparent;
                    background-clip: padding-box;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0,0,0,0.12);
                    background-clip: padding-box;
                }
            `}</style>
        </div>
    );
};

export default TeacherAnnouncement;
