import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { AuthLayout } from "@/components/layout/auth-layout";
import { LoginPage } from "@/features/auth/pages/login-page";
import { RegisterPage } from "@/features/auth/pages/register-page";
import { ForgotPasswordPage } from "@/features/auth/pages/forgot-password-page";
import { ResetPasswordPage } from "@/features/auth/pages/reset-password-page";
import { VerifyEmailPage } from "@/features/auth/pages/verify-email-page";
import { CreateChallengePage } from "@/features/challenges/pages/create-challenge-page";
import { ChallengeListPage } from "@/features/challenges/pages/challenge-list-page";
import { ChallengeSettingsPage } from "@/features/challenges/pages/challenge-settings-page";
import { ChallengeCompletedPage } from "@/features/challenges/pages/challenge-completed-page";
import { ChallengeDetailPage } from "@/features/challenges/pages/challenge-detail-page";
import { TrainingDayPage } from "@/features/training/pages/training-day-page";
import { ProfilePage } from "@/features/profiles/pages/profile-page";
import { StatisticsPage } from "@/features/statistics/pages/statistics-page";
import { ChallengeStatisticsPage } from "@/features/statistics/pages/challenge-statistics-page";
import { RoutineDetailPage } from "@/features/routine/pages/routine-page";
import { RoutineListPage } from "@/features/routine/pages/routine-list-page";
import { DashboardPage } from "@/pages/dashboard/dashboard-page";
import { ProtectedRoute, PublicOnlyRoute } from "./route-guards";

const router = createBrowserRouter([
  { element: <PublicOnlyRoute />, children: [{ element: <AuthLayout />, children: [{ path: "/login", element: <LoginPage /> }, { path: "/register", element: <RegisterPage /> }, { path: "/verify-email", element: <VerifyEmailPage /> }, { path: "/forgot-password", element: <ForgotPasswordPage /> }] }] },
  { element: <AuthLayout />, children: [{ path: "/reset-password", element: <ResetPasswordPage /> }] },
  { element: <ProtectedRoute />, children: [{ element: <AppLayout />, children: [{ path: "/dashboard", element: <DashboardPage /> }, { path: "/routine", element: <RoutineListPage /> }, { path: "/routine/:sessionDate", element: <RoutineDetailPage /> }, { path: "/profile", element: <ProfilePage /> }, { path: "/statistics", element: <StatisticsPage /> }, { path: "/challenges", element: <ChallengeListPage /> }, { path: "/challenges/new", element: <CreateChallengePage /> }, { path: "/challenges/:challengeId", element: <ChallengeDetailPage /> }, { path: "/challenges/:challengeId/analytics", element: <ChallengeStatisticsPage /> }, { path: "/challenges/:challengeId/settings", element: <ChallengeSettingsPage /> }, { path: "/challenges/:challengeId/completed", element: <ChallengeCompletedPage /> }, { path: "/training/:trainingDayId", element: <TrainingDayPage /> }] }] },
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);

export function AppRouter() { return <RouterProvider router={router} />; }
