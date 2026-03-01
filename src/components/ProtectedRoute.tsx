import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
    const activeCode = localStorage.getItem("active_license_code");

    if (!activeCode) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
