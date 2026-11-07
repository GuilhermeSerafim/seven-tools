import { Suspense, lazy, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLoader } from "@/components/ui/app-loader";
import { AuthProvider } from "@/auth/AuthContext";
import { AdminRoute, ForcePasswordChangeRoute, PendingReviewRoute, ProtectedRoute, PublicOnlyRoute } from "@/auth/ProtectedRoute";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import LandingPage from "./pages/LandingPage.tsx";

const Layout = lazy(() =>
  import("@/components/layout/Layout").then((module) => ({ default: module.Layout }))
);
const Index = lazy(() => import("@/pages/Index.tsx"));
const Tools = lazy(() => import("@/pages/Tools.tsx"));
const ChatToolPage = lazy(() => import("@/pages/ChatToolPage.tsx"));
const ToolApp = lazy(() => import("@/pages/ToolApp.tsx"));
const ModulePage = lazy(() => import("@/pages/ModulePage.tsx"));
const Profile = lazy(() => import("@/pages/profile/Profile.tsx"));
const Login = lazy(() => import("@/pages/auth/Login.tsx"));
const Register = lazy(() => import("@/pages/auth/Register.tsx"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword.tsx"));
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword.tsx"));
const AwaitingValidation = lazy(() => import("@/pages/auth/AwaitingValidation.tsx"));
const ChangePassword = lazy(() => import("@/pages/auth/ChangePassword.tsx"));
const NotFound = lazy(() => import("@/pages/NotFound.tsx"));
const MembershipReviewsPage = lazy(() => import("@/pages/admin/MembershipReviewsPage.tsx"));
const ProposalShell = lazy(() => import("@/pages/tools/PropostaComercial/ProposalShell.tsx"));
const ProposalList = lazy(() => import("@/pages/tools/PropostaComercial/ProposalList.tsx"));
const ProposalView = lazy(() => import("@/pages/tools/PropostaComercial/ProposalView.tsx"));
const LeadQualificationShell = lazy(() =>
  import("@/pages/tools/QualificacaoLeads/LeadQualificationShell.tsx")
);
const LeadQualificationQueue = lazy(() =>
  import("@/pages/tools/QualificacaoLeads/LeadQualificationQueue.tsx")
);
const LeadQualificationConfig = lazy(() =>
  import("@/pages/tools/QualificacaoLeads/LeadQualificationConfig.tsx")
);
const LeadQualificationForm = lazy(() =>
  import("@/pages/tools/QualificacaoLeads/LeadQualificationForm.tsx")
);
const LeadQualificationDetail = lazy(() =>
  import("@/pages/tools/QualificacaoLeads/LeadQualificationDetail.tsx")
);
const ChatDemoPure = lazy(() => import("@/pages/chat-demo/ChatDemoPure"));

const queryClient = new QueryClient();

const RouteFallback = () => <AppLoader fullscreen size="sm" label="Carregando..." />;

const withSuspense = (element: ReactNode) => (
  <Suspense fallback={<RouteFallback />}>{element}</Suspense>
);

const AuthApp = () => (
  <AuthProvider>
    <Outlet />
  </AuthProvider>
);

const ProtectedContent = () => (
  <FavoritesProvider>
    <Outlet />
  </FavoritesProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/esqueci-senha" element={withSuspense(<ForgotPassword />)} />
          <Route path="/redefinir-senha" element={withSuspense(<ResetPassword />)} />

          <Route element={<AuthApp />}>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={withSuspense(<Login />)} />
              <Route path="/register" element={withSuspense(<Register />)} />
            </Route>

            <Route element={<ForcePasswordChangeRoute />}>
              <Route path="/alterar-senha" element={withSuspense(<ChangePassword />)} />
            </Route>


            <Route element={<PendingReviewRoute />}>
              <Route path="/aguardando-validacao" element={withSuspense(<AwaitingValidation />)} />
            </Route>

            <Route element={<AdminRoute />}>
              <Route element={withSuspense(<Layout />)}>
                <Route
                  path="/admin/membros-pendentes"
                  element={withSuspense(<MembershipReviewsPage />)}
                />
              </Route>
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<ProtectedContent />}>
                <Route element={withSuspense(<Layout />)}>
                  <Route path="/hub" element={withSuspense(<Index />)} />
                  <Route path="/tools" element={withSuspense(<Tools />)} />
                  <Route path="/modules/:slug" element={withSuspense(<ModulePage />)} />
                  <Route path="/tools/:slug" element={withSuspense(<ChatToolPage />)} />
                  <Route path="/tools/:slug/app/chat" element={withSuspense(<ChatToolPage />)} />

                  <Route
                    path="/tools/proposta-comercial-smart/app"
                    element={withSuspense(<ProposalShell />)}
                  >
                    <Route index element={withSuspense(<ProposalList />)} />
                    <Route path="validate" element={<Navigate to="/tools/proposta-comercial-smart/app/chat" replace />} />
                    <Route path=":proposalId" element={withSuspense(<ProposalView />)} />
                  </Route>

                  <Route
                    path="/tools/diagnostico-comercial-caloni/app"
                    element={<Navigate to="/tools/diagnostico-comercial-caloni/app/chat" replace />}
                  />

                  <Route
                    path="/tools/qualificacao-de-leads/app"
                    element={withSuspense(<LeadQualificationShell />)}
                  >
                    <Route index element={withSuspense(<LeadQualificationQueue />)} />
                    <Route path="config" element={withSuspense(<LeadQualificationConfig />)} />
                    <Route path="new" element={withSuspense(<LeadQualificationForm />)} />
                    <Route path=":leadId" element={withSuspense(<LeadQualificationDetail />)} />
                  </Route>

                  <Route path="/tools/:slug/app" element={withSuspense(<ToolApp />)} />
                  <Route path="/profile" element={withSuspense(<Profile />)} />
                </Route>
              </Route>
            </Route>
          </Route>

          <Route path="/chat/demo" element={<Navigate to="/chat/demo/pure" replace />} />
          <Route path="/chat/demo/pure" element={withSuspense(<ChatDemoPure />)} />
          <Route path="/chat/demo/split" element={<Navigate to="/chat/demo/pure" replace />} />

          <Route path="*" element={withSuspense(<NotFound />)} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
