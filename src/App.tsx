import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navigation from "./components/navigation/Navigation";
import Learn from "./pages/Learn";
import Practice from "./pages/Practice";
import SetDetail from "./pages/SetDetail";
import Kanji from "./pages/Kanji";
import KanjiList from "./pages/KanjiList";
import "./App.css";

export default function App() {
  return (
    <Router basename="/kanjii">
      <div className="app-container">
        <Navigation />

        <Routes>
          <Route path="/" element={<Learn />} />
          <Route path="/kanji-list" element={<KanjiList />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/sets/:setId" element={<SetDetail />} />
          <Route path="/kanji/:char" element={<Kanji />} />
        </Routes>
      </div>
    </Router>
  );
}
