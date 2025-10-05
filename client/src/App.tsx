import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import ApplyLeave from "@/pages/ApplyLeave";
import RegularizeAttendance from "@/pages/RegularizeAttendance";
import LeaveSummary from "@/pages/LeaveSummary";
import AttendanceSummary from "@/pages/AttendanceSummary";
import LeaveCorrection from "@/pages/LeaveCorrection";
import SalarySlips from "@/pages/SalarySlips";
import AIAssistant from "@/pages/AIAssistant";
import Documents from "@/pages/Documents";

const pageConfig = {
  "/": {
    title: "Dashboard",
    subtitle: "Welcome back, manage your HR tasks efficiently"
  },
  "/apply-leave": {
    title: "Apply Leave", 
    subtitle: "Submit a new leave request"
  },
  "/regularize": {
    title: "Regularize Attendance",
    subtitle: "Fix missed punches or mark work from home"
  },
  "/leave-summary": {
    title: "Leave Summary",
    subtitle: "View your leave balance and history"
  },
  "/attendance": {
    title: "Attendance Summary", 
    subtitle: "Track your monthly attendance records"
  },
  "/leave-correction": {
    title: "Leave Correction",
    subtitle: "Edit or cancel your leave requests"
  },
  "/salary-slips": {
    title: "Salary Slips",
    subtitle: "View and download your salary slips"
  },
  "/ai-assistant": {
    title: "AI HR Assistant",
    subtitle: "Get instant answers to HR policy questions"
  },
  "/documents": {
    title: "HR Documents",
    subtitle: "Manage and upload HR policy documents"
  }
};

function AuthenticatedRoute({ 
  children, 
  path 
}: { 
  children: React.ReactNode;
  path: string;
}) {
  const config = pageConfig[path as keyof typeof pageConfig] || {
    title: "HR Portal",
    subtitle: "Employee Self Service"
  };

  return (
    <Layout title={config.title} subtitle={config.subtitle}>
      {children}
    </Layout>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/">
            <AuthenticatedRoute path="/">
              <Dashboard />
            </AuthenticatedRoute>
          </Route>
          <Route path="/apply-leave">
            <AuthenticatedRoute path="/apply-leave">
              <ApplyLeave />
            </AuthenticatedRoute>
          </Route>
          <Route path="/regularize">
            <AuthenticatedRoute path="/regularize">
              <RegularizeAttendance />
            </AuthenticatedRoute>
          </Route>
          <Route path="/leave-summary">
            <AuthenticatedRoute path="/leave-summary">
              <LeaveSummary />
            </AuthenticatedRoute>
          </Route>
          <Route path="/attendance">
            <AuthenticatedRoute path="/attendance">
              <AttendanceSummary />
            </AuthenticatedRoute>
          </Route>
          <Route path="/leave-correction">
            <AuthenticatedRoute path="/leave-correction">
              <LeaveCorrection />
            </AuthenticatedRoute>
          </Route>
          <Route path="/salary-slips">
            <AuthenticatedRoute path="/salary-slips">
              <SalarySlips />
            </AuthenticatedRoute>
          </Route>
          <Route path="/ai-assistant">
            <AuthenticatedRoute path="/ai-assistant">
              <AIAssistant />
            </AuthenticatedRoute>
          </Route>
          <Route path="/documents">
            <AuthenticatedRoute path="/documents">
              <Documents />
            </AuthenticatedRoute>
          </Route>
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
