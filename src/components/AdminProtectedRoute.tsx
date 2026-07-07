import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import AdminLayout from './AdminLayout';
import { useAdminAuth, type AdminRole } from '../contexts/AdminAuthContext';

interface AdminProtectedRouteProps {
  children: ReactNode;
  requiredRole?: AdminRole;
  noLayout?: boolean;
}

export default function AdminProtectedRoute({ children, requiredRole, noLayout }: AdminProtectedRouteProps) {
  const { admin, loading } = useAdminAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: '#0A2A19' }}>
        <CircularProgress sx={{ color: '#1B6B3E' }} />
      </Box>
    );
  }

  if (!admin) return <Navigate to="/admin/login" replace />;

  if (requiredRole && admin.role !== 'super_admin' && admin.role !== requiredRole) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (noLayout) return <>{children}</>;
  return <AdminLayout>{children}</AdminLayout>;
}
