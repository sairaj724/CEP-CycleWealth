import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ScrapDealer from "./pages/scrapDealer";
import Connections from "./pages/Connections";
import Consumer from "./pages/Consumer";
import Ecom from "./pages/Ecom";
import Artisan from "./pages/Artisan";
import Enterprise from "./pages/Enterprise";
import CompanyOrder from "./pages/CompanyOrder";
import About from "./pages/About";
import Goals from "./pages/Goals";
import Contact from "./pages/Contact";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/scrapdealer" element={<ScrapDealer />} />
        <Route path="/connections" element={<Connections />} />
        <Route path="/consumer" element={<Consumer />} />
        <Route path="/ecom" element={<Ecom />} />
        <Route path="/artisan" element={<Artisan />} />
        <Route path="/enterprise" element={<Enterprise />} />
        <Route path="/companyorder" element={<CompanyOrder />} />
        <Route path="/about" element={<About />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;