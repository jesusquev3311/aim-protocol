import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { AuthLayout } from "@/components/layout/auth-layout";
import { LoginPage } from "@/features/auth/pages/login-page";
import { RegisterPage } from "@/features/auth/pages/register-page";
import { CreateChallengePage } from "@/features/challenges/pages/create-challenge-page";
import { ChallengeSettingsPage } from "@/features/challenges/pages/challenge-settings-page";
import { ChallengeCompletedPage } from "@/features/challenges/pages/challenge-completed-page";
import { ChallengeDetailPage } from "@/features/challenges/pages/challenge-detail-page";
import { TrainingDayPage } from "@/features/training/pages/training-day-page";
import { ProfilePage } from "@/features/profiles/pages/profile-page";
import { StatisticsPage } from "@/features/statistics/pages/statistics-page";
import { ChallengeStatisticsPage } from "@/features/statistics/pages/challenge-statistics-page";
import { RoutinePage } from "@/features/routine/pages/routine-page";
import { DashboardPage } from "@/pages/dashboard/dashboard-page";
import { ProtectedRoute, PublicOnlyRoute } from "./route-guards";

const router = createBrowserRouter([
  { element: <PublicOnlyRoute />, children: [{ element: <AuthLayout />, children: [{ path: "/login", element: <LoginPage /> }, { path: "/register", element: <RegisterPage /> }] }] },
  { element: <ProtectedRoute />, children: [{ element: <AppLayout />, children: [{ path: "/dashboard", element: <DashboardPage /> }, { path: "/routine", element: <RoutinePage /> }, { path: "/profile", element: <ProfilePage /> }, { path: "/statistics", element: <StatisticsPage /> }, { path: "/challenges/new", element: <CreateChallengePage /> }, { path: "/challenges/:challengeId", element: <ChallengeDetailPage /> }, { path: "/challenges/:challengeId/analytics", element: <ChallengeStatisticsPage /> }, { path: "/challenges/:challengeId/settings", element: <ChallengeSettingsPage /> }, { path: "/challenges/:challengeId/completed", element: <ChallengeCompletedPage /> }, { path: "/training/:trainingDayId", element: <TrainingDayPage /> }] }] },
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);

export function AppRouter() { return <RouterProvider router={router} />; }
