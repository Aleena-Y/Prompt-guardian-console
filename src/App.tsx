import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PromptPlayground } from "@/pages/PromptPlayground";
import { DetectionAnalysis } from "@/pages/DetectionAnalysis";
import { PromptLogs } from "@/pages/PromptLogs";
import { MonitoringDashboard } from "@/pages/MonitoringDashboard";
import { SecurityPolicies } from "@/pages/SecurityPolicies";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<PromptPlayground />} />
            <Route path="/analysis" element={<DetectionAnalysis />} />
            <Route path="/logs" element={<PromptLogs />} />
            <Route path="/monitoring" element={<MonitoringDashboard />} />
            <Route path="/policies" element={<SecurityPolicies />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DashboardLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
