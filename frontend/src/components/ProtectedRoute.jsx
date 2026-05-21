// ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {
  const role = sessionStorage.getItem("role"); // Use role as the proof of login
  const expiry = sessionStorage.getItem("sessionExpiry");

  if (!role || (expiry && Date.now() > Number(expiry))) {
    sessionStorage.clear();
    return <Navigate to="/signin" />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/signin" />;
  }

  return children;
}

export default ProtectedRoute;
