import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ScrapDealer from "./pages/scrapDealer";
import Connections from "./pages/Connections";
import AddScrapCollection from "./pages/AddScrapCollection";
import ViewScrapInventory from "./pages/ViewScrapInventory";
import EditScrapItem from "./pages/EditScrapItem";
import Consumer from "./pages/Consumer";
import Ecom from "./pages/Ecom";
import Artisan from "./pages/Artisan";
import Enterprise from "./pages/Enterprise";
import CompanyOrder from "./pages/CompanyOrder";
import Order from "./pages/Order";
import MyOrders from "./pages/MyOrders";
import About from "./pages/About";
import ScrapPrices from "./pages/ScrapPrices";
import SegregationGuide from "./pages/SegregationGuide";
import Contact from "./pages/Contact";

console.log('App.jsx imports loaded')

function App() {
  console.log('App component rendering')
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/scrapdealer" element={<ScrapDealer />} />
        <Route path="/connections" element={<Connections />} />
        <Route path="/add-scrap" element={<AddScrapCollection />} />
        <Route path="/view-inventory" element={<ViewScrapInventory />} />
        <Route path="/edit-scrap/:id" element={<EditScrapItem />} />
        <Route path="/consumer" element={<Consumer />} />
        <Route path="/ecom" element={<Ecom />} />
        <Route path="/artisan" element={<Artisan />} />
        <Route path="/enterprise" element={<Enterprise />} />
        <Route path="/companyorder" element={<CompanyOrder />} />
        <Route path="/order" element={<Order />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/about" element={<About />} />
        <Route path="/scrap-prices" element={<ScrapPrices />} />
        <Route path="/segregation-guide" element={<SegregationGuide />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;