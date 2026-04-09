import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ScrapDealer from "./pages/scrapDealer";
import Connections from "./pages/Connections";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/scrapdealer" element={<ScrapDealer />} />
        <Route path="/connections" element={<Connections />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;