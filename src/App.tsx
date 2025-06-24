
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FantacalciettoProvider } from "@/context/FantacalciettoContext";
import Navigation from "@/components/Navigation";
import Ranking from "@/pages/Ranking";
import SquadCreator from "@/pages/SquadCreator";
import MatchTools from "@/pages/MatchTools";
import DataExtractor from "@/pages/DataExtractor";
import Download from "@/pages/Download";
import Upload from "@/pages/Upload";
import StorageManagement from "@/pages/StorageManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <FantacalciettoProvider>
          <div className="min-h-screen bg-[#EAEFEF]">
            <Navigation />            <Routes>              <Route path="/" element={<Ranking />} />
              <Route path="/squad-creator" element={<SquadCreator />} />
              <Route path="/match-tools" element={<MatchTools />} />
              <Route path="/data-extractor" element={<DataExtractor />} />
              <Route path="/download" element={<Download />} />
              <Route path="/upload" element={<Upload />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </FantacalciettoProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
