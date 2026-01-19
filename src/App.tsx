import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navigation from "./components/navigation/Navigation";
import Learn from "./pages/Learn";
import Practice from "./pages/Practice";
import SetDetail from "./pages/SetDetail";
import Kanji from "./pages/Kanji";
import KanjiList from "./pages/KanjiList";
import Settings from "./pages/Settings";
import "./App.css";

export default function App() {
  return (
    <Router basename="/kanjii">
      <div className="app-container">
        <Navigation />

        <Routes>
          <Route path="/" element={<Learn />} />
          <Route path="/sets/:setId" element={<SetDetail />} />
          <Route path="/kanji-list" element={<KanjiList />} />
          <Route path="/kanji/:char" element={<Kanji />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
}
