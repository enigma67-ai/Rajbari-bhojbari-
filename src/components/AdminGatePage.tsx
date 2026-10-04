import React from 'react';
import { AdminDashboard, BookingRecord } from './AdminDashboard';
import { UserProfile } from '../types';

export type BookingRow = BookingRecord;

interface AdminGatePageProps {
  currentUser?: UserProfile | null;
  onNavigateToHome?: () => void;
  onSignOutAdmin?: () => void;
}

export const AdminGatePage: React.FC<AdminGatePageProps> = ({ 
  currentUser, 
  onNavigateToHome = () => {},
  onSignOutAdmin
}) => {
  return (
    <AdminDashboard
      currentUser={currentUser}
      onNavigateToHome={onNavigateToHome}
      onSignOutAdmin={onSignOutAdmin}
    />
  );
};

export default AdminGatePage;
