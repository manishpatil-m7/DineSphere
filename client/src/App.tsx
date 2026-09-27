import { Routes, Route, Navigate } from 'react-router-dom';
import Intro from './pages/Intro';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Kitchen from './pages/Kitchen';
import AdminLogin from './pages/AdminLogin';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import OrdersPage from './pages/admin/OrdersPage';
import KitchenPage from './pages/admin/KitchenPage';
import MenuPage from './pages/admin/MenuPage';
import InventoryPage from './pages/admin/InventoryPage';
import TablesPage from './pages/admin/TablesPage';
import ReservationsPage from './pages/admin/ReservationsPage';
import CustomersPage from './pages/admin/CustomersPage';
import CouponsPage from './pages/admin/CouponsPage';
import ReviewsPage from './pages/admin/ReviewsPage';
import SupportPage from './pages/admin/SupportPage';
import AnnouncementsPage from './pages/admin/AnnouncementsPage';
import ReportsPage from './pages/admin/ReportsPage';
import SettingsPage from './pages/admin/SettingsPage';
import AuditLogPage from './pages/admin/AuditLogPage';

function App() {
  return (
    <div className="min-h-screen w-full bg-[#0C0C0C] text-[#D7E2EA] font-kanit">
      <Routes>
        <Route path="/" element={<Navigate to="/intro" replace />} />
        <Route path="/intro" element={<Intro />} />
        <Route path="/home" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/reservations" element={<Navigate to="/dashboard?tab=reservations" replace />} />
        <Route path="/customer" element={<Dashboard />} />
        <Route path="/reservations" element={<Navigate to="/dashboard?tab=reservations" replace />} />
        <Route path="/about" element={<Navigate to="/intro#about" replace />} />
        <Route path="/kitchen" element={<Kitchen />} />

        {/* Admin App Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrdersPage />} />
          <Route path="kitchen" element={<KitchenPage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="tables" element={<TablesPage />} />
          <Route path="reservations" element={<ReservationsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="coupons" element={<CouponsPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="audit-log" element={<AuditLogPage />} />
          <Route path="logout" element={<Navigate to="/admin/login" replace />} />
        </Route>

        {/* 404 Catch-all */}
        <Route path="*" element={<Navigate to="/intro" replace />} />
      </Routes>
    </div>
  );
}

export default App;