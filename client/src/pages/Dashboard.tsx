import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, FileText, Bot, TrendingUp, CheckCircle, AlertCircle, Users } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const quickActions = [
    { 
      title: "Apply for Leave", 
      description: "Submit new leave request",
      icon: Calendar,
      href: "/apply-leave",
      color: "bg-primary/10 text-primary"
    },
    { 
      title: "Regularize Attendance", 
      description: "Fix missed punches",
      icon: Clock,
      href: "/regularize",
      color: "bg-accent/10 text-accent"
    },
    { 
      title: "Ask AI Assistant", 
      description: "HR policy questions",
      icon: Bot,
      href: "/ai-assistant",
      color: "bg-purple-500/10 text-purple-500"
    },
    { 
      title: "View Salary Slips", 
      description: "Download pay stubs",
      icon: FileText,
      href: "/salary-slips",
      color: "bg-blue-500/10 text-blue-500"
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-accent/10 text-accent">This Year</span>
            </div>
            <h3 className="text-3xl font-bold text-foreground mb-1">
              {stats?.leavesUsed || 0}
            </h3>
            <p className="text-sm text-muted-foreground">Leaves Taken</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-accent/10">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">Available</span>
            </div>
            <h3 className="text-3xl font-bold text-foreground mb-1">
              {stats?.leavesRemaining || 0}
            </h3>
            <p className="text-sm text-muted-foreground">Leaves Remaining</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <CheckCircle className="w-6 h-6 text-blue-500" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-500/10 text-blue-500">This Month</span>
            </div>
            <h3 className="text-3xl font-bold text-foreground mb-1">
              {stats?.attendanceRate || 0}%
            </h3>
            <p className="text-sm text-muted-foreground">Attendance Rate</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <AlertCircle className="w-6 h-6 text-amber-500" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-500/10 text-amber-500">Pending</span>
            </div>
            <h3 className="text-3xl font-bold text-foreground mb-1">
              {stats?.pendingRequests || 0}
            </h3>
            <p className="text-sm text-muted-foreground">Pending Requests</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={index} href={action.href}>
                    <Button variant="ghost" className="w-full justify-start p-3 h-auto">
                      <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mr-3`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">{action.title}</p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                    </Button>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Leave Balance Overview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Leave Balance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.leaveBalances?.length > 0 ? (
                <div className="space-y-4">
                  {stats.leaveBalances.map((balance: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {balance.type === 'casual' ? 'Casual Leave' :
                           balance.type === 'sick' ? 'Sick Leave' :
                           balance.type === 'earned' ? 'Earned Leave' : balance.type}
                        </span>
                        <span className="text-sm font-semibold">
                          {balance.used}/{balance.total}
                        </span>
                      </div>
                      <Progress 
                        value={(balance.used / balance.total) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No leave balance data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
