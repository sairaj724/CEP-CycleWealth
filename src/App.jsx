import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ScrapDealer from "./pages/scrapDealer";
import Connections from "./pages/Connections";
import AddScrapCollection from "./pages/AddScrapCollection";
import ViewScrapInventory from "./pages/ViewScrapInventory";
import EditScrapItem from "./pages/EditScrapItem";
import DealerProfile from "./pages/DealerProfile";
import SkilledLaborProfile from "./pages/SkilledLaborProfile";
import Consumer from "./pages/Consumer";
import Ecom from "./pages/Ecom";
import Artisan from "./pages/Artisan";
import Enterprise from "./pages/Enterprise";
import CompanyOrder from "./pages/CompanyOrder";
import OrderHistory from "./pages/OrderHistory";
import Transactions from "./pages/Transactions";
import Order from "./pages/Order";
import MyOrders from "./pages/MyOrders";
import CustomerProfile from "./pages/CustomerProfile";
import About from "./pages/About";
import ScrapPrices from "./pages/ScrapPrices";
import SegregationGuide from "./pages/SegregationGuide";
import Contact from "./pages/Contact";
import Notifications from "./pages/Notifications";

console.log('App.jsx imports loaded')

// Dashboard component that redirects based on user role
function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionUser = sessionStorage.getItem('user');
    if (sessionUser) {
      setUser(JSON.parse(sessionUser));
    }
    setLoading(false);
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  // Redirect based on role
  switch (user.role) {
    case 'ScrapDealer':
      return <Navigate to="/scrapdealer" replace />;
    case 'Consumer':
      return <Navigate to="/consumer" replace />;
    case 'Artisan':
      return <Navigate to="/artisan" replace />;
    case 'Enterprise':
      return <Navigate to="/enterprise" replace />;
    default:
      return <Navigate to="/profile" replace />;
  }
}

function App() {
  console.log('App component rendering')
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/scrapdealer" element={<ScrapDealer />} />
        <Route path="/connections" element={<Connections />} />
        <Route path="/add-scrap" element={<AddScrapCollection />} />
        <Route path="/view-inventory" element={<ViewScrapInventory />} />
        <Route path="/edit-scrap/:id" element={<EditScrapItem />} />
        <Route path="/dealer-profile" element={<DealerProfile />} />
        <Route path="/skilled-labor-profile" element={<SkilledLaborProfile />} />
        <Route path="/consumer" element={<Consumer />} />
        <Route path="/ecom" element={<Ecom />} />
        <Route path="/artisan" element={<Artisan />} />
        <Route path="/enterprise" element={<Enterprise />} />
        <Route path="/companyorder" element={<CompanyOrder />} />
        <Route path="/orderhistory" element={<OrderHistory />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/order" element={<Order />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/profile" element={<CustomerProfile />} />
        <Route path="/about" element={<About />} />
        <Route path="/scrap-prices" element={<ScrapPrices />} />
        <Route path="/segregation-guide" element={<SegregationGuide />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/notifications" element={<Notifications />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;