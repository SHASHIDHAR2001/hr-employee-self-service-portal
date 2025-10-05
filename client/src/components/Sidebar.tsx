import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  Home, 
  CalendarPlus, 
  ClockArrowUp, 
  PieChart, 
  CalendarCheck, 
  Edit, 
  FileText, 
  Bot, 
  FolderOpen,
  Briefcase,
  MoreVertical
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Apply Leave", href: "/apply-leave", icon: CalendarPlus },
  { name: "Regularize Attendance", href: "/regularize", icon: ClockArrowUp },
  { name: "Leave Summary", href: "/leave-summary", icon: PieChart },
  { name: "Attendance Summary", href: "/attendance", icon: CalendarCheck },
  { name: "Leave Correction", href: "/leave-correction", icon: Edit },
  { name: "Salary Slips", href: "/salary-slips", icon: FileText },
  { name: "AI HR Assistant", href: "/ai-assistant", icon: Bot },
  { name: "HR Documents", href: "/documents", icon: FolderOpen },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border z-40">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Briefcase className="text-primary-foreground text-lg" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">HR Portal</h1>
              <p className="text-xs text-muted-foreground">Employee Self Service</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <a 
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive 
                          ? "bg-primary/10 text-primary border-l-3 border-primary" 
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-foreground">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.employeeId}
              </p>
            </div>
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </aside>
  );
}
