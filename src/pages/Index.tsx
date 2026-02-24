import { BookOpenCheck } from "lucide-react";
import heroIllustration from "@/assets/hero-illustration.png";
import FeatureList from "@/components/landing/FeatureList";
import LevelSelector from "@/components/landing/LevelSelector";
import NoticeBox from "@/components/landing/NoticeBox";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left Panel - Dark Hero */}
      <div className="relative flex flex-1 flex-col justify-center overflow-hidden bg-hero-dark px-6 py-12 lg:px-16 lg:py-20">
        {/* Background illustration */}
        <div className="pointer-events-none absolute inset-0 opacity-15">
          <img
            src={heroIllustration}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-md">
          {/* Logo */}
          <div
            className="mb-8 flex items-center gap-3 animate-fade-in-up"
            style={{ opacity: 0, animationDelay: "0.05s" }}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-hero-accent">
              <BookOpenCheck className="h-6 w-6 text-accent-foreground" />
            </div>
            <span className="text-xl font-bold text-hero-dark-foreground">
              RekanGuru
            </span>
          </div>

          {/* Headline */}
          <h1
            className="mb-4 text-3xl font-extrabold leading-tight tracking-tight text-hero-dark-foreground lg:text-4xl animate-fade-in-up"
            style={{ opacity: 0, animationDelay: "0.1s" }}
          >
            Taklukan TKA Bersama{" "}
            <span className="text-gradient-accent">RekanGuru</span>
          </h1>

          <p
            className="mb-8 max-w-sm text-base leading-relaxed text-hero-dark-muted animate-fade-in-up"
            style={{ opacity: 0, animationDelay: "0.2s" }}
          >
            Simulasi Tes Kemampuan Akademik untuk siswa SD &amp; SMP. Tanpa
            login, langsung kerjakan!
          </p>

          <FeatureList />
        </div>
      </div>

      {/* Right Panel - Light */}
      <div className="flex flex-1 flex-col justify-center bg-background px-6 py-12 lg:px-16 lg:py-20">
        <div className="mx-auto w-full max-w-md">
          <h2
            className="mb-2 text-2xl font-bold text-foreground animate-fade-in-up"
            style={{ opacity: 0, animationDelay: "0.3s" }}
          >
            Selamat Datang 👋
          </h2>
          <p
            className="mb-8 text-muted-foreground animate-fade-in-up"
            style={{ opacity: 0, animationDelay: "0.35s" }}
          >
            Pilih jenjang pendidikan untuk memulai simulasi
          </p>

          <LevelSelector />

          <div className="mt-8">
            <NoticeBox />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
