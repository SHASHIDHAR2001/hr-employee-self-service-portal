import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Eye, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function SalarySlips() {
  const [selectedYear, setSelectedYear] = useState("2024");

  const { data: salarySlips, isLoading } = useQuery({
    queryKey: ['/api/salary-slips'],
  });

  const getMonthName = (month: number) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[month - 1];
  };

  const getGradientColor = (index: number) => {
    const gradients = [
      "from-primary to-blue-600",
      "from-accent to-green-600", 
      "from-purple-500 to-purple-700",
      "from-blue-500 to-blue-700",
      "from-amber-500 to-orange-600",
      "from-pink-500 to-rose-600"
    ];
    return gradients[index % gradients.length];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-48 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const filteredSlips = salarySlips?.filter((slip: any) => 
    slip.year.toString() === selectedYear
  ) || [];

  // Calculate YTD summary
  const ytdSummary = filteredSlips.reduce((acc: any, slip: any) => ({
    gross: acc.gross + parseFloat(slip.grossSalary || 0),
    net: acc.net + parseFloat(slip.netSalary || 0),
    deductions: acc.deductions + (parseFloat(slip.grossSalary || 0) - parseFloat(slip.netSalary || 0))
  }), { gross: 0, net: 0, deductions: 0 });

  const averageMonthly = filteredSlips.length > 0 ? ytdSummary.net / filteredSlips.length : 0;

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Salary Slips</h3>
              <p className="text-sm text-muted-foreground">View and download your monthly salary slips</p>
            </div>
            <div className="flex items-center gap-3">
              <Select defaultValue="all">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>
                      {getMonthName(i + 1)} {selectedYear}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Slips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSlips.length > 0 ? (
          filteredSlips.map((slip: any, index: number) => (
            <Card key={slip.id} className="hover:shadow-lg transition-shadow overflow-hidden">
              <div className={`bg-gradient-to-br ${getGradientColor(index)} p-6 text-primary-foreground`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm opacity-90 mb-1">Salary Slip</p>
                    <h4 className="text-2xl font-bold">
                      {getMonthName(slip.month)} {slip.year}
                    </h4>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm opacity-90">Net Salary</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(parseFloat(slip.netSalary || 0))}
                  </p>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gross Salary:</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(parseFloat(slip.grossSalary || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deductions:</span>
                    <span className="font-semibold text-destructive">
                      -{formatCurrency(parseFloat(slip.grossSalary || 0) - parseFloat(slip.netSalary || 0))}
                    </span>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment Date:</span>
                      <span className="font-medium text-foreground">
                        {slip.paymentDate ? format(new Date(slip.paymentDate), "MMM dd, yyyy") : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button className="flex-1 px-4" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="outline" size="sm" className="p-2">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No salary slips found for {selectedYear}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Year-to-Date Summary */}
      {filteredSlips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Year-to-Date Summary ({selectedYear})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Gross Pay</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(ytdSummary.gross)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Deductions</p>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(ytdSummary.deductions)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Net Pay</p>
                <p className="text-2xl font-bold text-accent">
                  {formatCurrency(ytdSummary.net)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Average Monthly</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(averageMonthly)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
