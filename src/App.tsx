import "./globals.css";

import { Navigate, Route, Routes } from "react-router-dom";

import { Footer, Header } from "@/components/features";
import { VStack } from "@/components/ui";

import { HomePage } from "./pages";

const App = () => {
  return (
    <div className="flex min-h-screen w-full justify-center bg-gray-200 pt-[env(safe-area-inset-top)] font-[Pretendard] font-medium text-gray-800 antialiased">
      <VStack className="min-h-screen w-full max-w-120 justify-between bg-white">
        <Header />
        <main className="flex min-h-0 w-full flex-1 justify-center">
          <div className="size-full">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
        <Footer />
      </VStack>
    </div>
  );
};

export default App;
