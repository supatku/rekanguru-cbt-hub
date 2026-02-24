import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import DashboardGuru from "./pages/DashboardGuru";
import KelolaKelas from "./pages/KelolaKelas";
import PilihPaket from "./pages/PilihPaket";
import PilihMapel from "./pages/PilihMapel";
import ExamInterface from "./pages/ExamInterface";
import StudentProgress from "./pages/StudentProgress";
import AdminKelolaSoal from "./pages/AdminKelolaSoal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/kelola-kelas" element={<KelolaKelas />} />
          <Route path="/dashboard-guru" element={<DashboardGuru />} />
          <Route path="/paket/:level" element={<PilihPaket />} />
          <Route path="/mapel/:level/:paket" element={<PilihMapel />} />
          <Route path="/exam/:level/:paket/:mapel" element={<ExamInterface />} />
          <Route path="/student-progress" element={<StudentProgress />} />
          <Route path="/admin/kelola-soal" element={<AdminKelolaSoal />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
