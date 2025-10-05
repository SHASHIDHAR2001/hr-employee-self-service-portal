import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Calendar, Clock, Bot, FileText, PieChart } from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: Calendar,
      title: "Leave Management",
      description: "Apply for leaves, track balances, and manage requests easily"
    },
    {
      icon: Clock,
      title: "Attendance Tracking",
      description: "View attendance records and regularize missed punches"
    },
    {
      icon: FileText,
      title: "Salary Slips",
      description: "Access and download your salary slips anytime"
    },
    {
      icon: Bot,
      title: "AI HR Assistant",
      description: "Get instant answers to HR policy questions"
    },
    {
      icon: PieChart,
      title: "Analytics Dashboard",
      description: "Track your HR metrics with comprehensive dashboards"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center">
              <Briefcase className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            HR Employee Self Service
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline your HR tasks with our AI-powered employee portal. 
            Manage leaves, track attendance, and get instant HR support.
          </p>
          <Button 
            size="lg" 
            className="px-8 py-3"
            onClick={() => window.location.href = '/api/login'}
          >
            Sign In to Continue
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Ready to get started?
              </h2>
              <p className="text-muted-foreground mb-6">
                Access all your HR needs in one place. Secure, fast, and user-friendly.
              </p>
              <Button 
                size="lg" 
                className="px-8"
                onClick={() => window.location.href = '/api/login'}
              >
                Sign In Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
