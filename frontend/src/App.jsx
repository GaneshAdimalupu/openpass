// frontend/src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateEvent from "./pages/CreateEvent";
import EventPublic from "./pages/EventPublic";
import EventDashboard from "./pages/EventDashboard";
import TicketView from "./pages/TicketView";
import CheckIn from "./pages/CheckIn";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/e/:slug" element={<EventPublic />} />
          <Route path="/ticket/:qrToken" element={<TicketView />} />

          {/* Protected */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/events/create" element={<PrivateRoute><CreateEvent /></PrivateRoute>} />
          <Route path="/events/:slug" element={<PrivateRoute><EventDashboard /></PrivateRoute>} />
          <Route path="/checkin/:slug" element={<PrivateRoute><CheckIn /></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
