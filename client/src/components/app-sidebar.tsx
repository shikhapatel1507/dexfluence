import { Link, useLocation } from "wouter";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, Megaphone, Users, GitBranch,
  BarChart3, Video, Zap, Wand2, BarChart2, Calendar, Settings,
  BookOpen, FlaskConical, CreditCard, ShoppingBag, Radar, Crosshair,
  LineChart, LogOut, User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth, useLogoutMutation } from "@/hooks/use-auth";

const platformItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Campaigns", url: "/campaigns", icon: Megaphone },
  { title: "AI Agents", url: "/agents", icon: Users },
  { title: "Content Pipeline", url: "/pipeline", icon: GitBranch, badge: "Live" },
  { title: "Videos", url: "/videos", icon: Video },
  { title: "Post Performance", url: "/performance", icon: LineChart },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const aiItems = [
  { title: "Script Generator", url: "/scripts", icon: Wand2 },
  { title: "Product Discovery", url: "/products", icon: ShoppingBag },
  { title: "Template Library", url: "/templates", icon: BookOpen },
  { title: "A/B Hook Tester", url: "/ab-test", icon: FlaskConical },
  { title: "Market Research", url: "/research", icon: BarChart2 },
  { title: "Trend Radar", url: "/trends", icon: Radar },
  { title: "Competitor Intel", url: "/competitor", icon: Crosshair },
];

const bottomItems = [
  { title: "Billing", url: "/billing", icon: CreditCard },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const logout = useLogoutMutation();

  const isActive = (url: string) => location === url || location.startsWith(url + "/");
  const displayName = user?.username?.split("@")[0] || "Brand";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4 border-b border-sidebar-border">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-bold text-sm text-sidebar-foreground leading-tight">Dexfluence</div>
              <div className="text-xs text-muted-foreground leading-tight">AI Content Factory</div>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="pt-2 flex flex-col">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-wider px-4 mb-1">
            Platform
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platformItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild data-active={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                      {"badge" in item && item.badge && (
                        <Badge variant="secondary" className="ml-auto text-xs px-1.5">{item.badge}</Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-wider px-4 mb-1">
            AI Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {aiItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild data-active={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="flex-1" />

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild data-active={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-4 py-3">
        {user ? (
          <div className="flex items-center gap-2">
            <Avatar className="w-7 h-7 flex-shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{displayName}</div>
              <div className="text-xs text-muted-foreground truncate">{user.username}</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 flex-shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => logout.mutate()}
              title="Sign out"
              data-testid="button-sidebar-logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">All systems operational</div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
