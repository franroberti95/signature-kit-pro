import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PDFStart from "./pages/PDFStart";
import PDFBuilderPage from "./pages/PDFBuilder";
import PDFCompletionPage from "./pages/PDFCompletion";
import RichTextBuilderPage from "./pages/RichTextBuilder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PDFStart />} />
          <Route path="/pdf-builder" element={<PDFBuilderPage />} />
          <Route path="/rich-text-builder" element={<RichTextBuilderPage />} />
          <Route path="/pdf-completion" element={<PDFCompletionPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
