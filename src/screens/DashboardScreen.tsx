import React from "react";
import DashboardView from "../components/DashboardView";
import { UserProfile } from "../services/api";

interface DashboardScreenProps {
  sessionToken: string;
  onSignOut: () => void;
  initialUserProfile?: UserProfile | null;
}

export default function DashboardScreen({
  sessionToken,
  onSignOut,
  initialUserProfile,
}: DashboardScreenProps) {
  return (
    <DashboardView
      sessionToken={sessionToken}
      onSignOut={onSignOut}
      initialUserProfile={initialUserProfile}
    />
  );
}

