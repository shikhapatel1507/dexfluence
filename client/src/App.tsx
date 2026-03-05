import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationCenter } from "@/components/notification-center";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import BrandDashboard from "@/pages/brand-dashboard";
import Dashboard from "@/pages/dashboard";
import Campaigns from "@/pages/campaigns";
import CampaignDetail from "@/pages/campaign-detail";
import CampaignWizard from "@/pages/campaign-wizard";
import Agents from "@/pages/agents";
import AgentProfile from "@/pages/agent-profile";
import Pipeline from "@/pages/pipeline";
import Analytics from "@/pages/analytics";
import Videos from "@/pages/videos";
import Research from "@/pages/research";
import ScriptGenerator from "@/pages/script-generator";
import ContentCalendar from "@/pages/calendar";
import Settings from "@/pages/settings";
import Onboarding from "@/pages/onboarding";
import Billing from "@/pages/billing";
import Templates from "@/pages/templates";
import AbTest from "@/pages/ab-test";
import ProductDiscovery from "@/pages/products";
import Competitor from "@/pages/competitor";
import Trends from "@/pages/trends";
import Performance from "@/pages/performance";

function AppLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "17rem",
    "--sidebar-width-icon": "3.5rem",
  };
  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50 h-[52px]">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <NotificationCenter />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppRouter() {
  const [location] = useLocation();
  const isLanding = location === "/";
  const isOnboarding = location === "/onboarding";

  if (isLanding || isOnboarding || location === "/login" || location === "/register" || location === "/brand") {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/brand" component={BrandDashboard} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/campaigns/new" component={CampaignWizard} />
        <Route path="/campaigns/:id" component={CampaignDetail} />
        <Route path="/campaigns" component={Campaigns} />
        <Route path="/agents/:id" component={AgentProfile} />
        <Route path="/agents" component={Agents} />
        <Route path="/pipeline" component={Pipeline} />
        <Route path="/videos" component={Videos} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/performance" component={Performance} />
        <Route path="/calendar" component={ContentCalendar} />
        <Route path="/products" component={ProductDiscovery} />
        <Route path="/competitor" component={Competitor} />
        <Route path="/trends" component={Trends} />
        <Route path="/scripts" component={ScriptGenerator} />
        <Route path="/templates" component={Templates} />
        <Route path="/ab-test" component={AbTest} />
        <Route path="/research" component={Research} />
        <Route path="/billing" component={Billing} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AppRouter />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
