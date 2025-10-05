import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Umbrella, Thermometer, Trophy, Calendar, Eye } from "lucide-react";
import { format } from "date-fns";

export default function LeaveSummary() {
  const { data: leaves, isLoading: leavesLoading } = useQuery({
    queryKey: ['/api/leaves'],
  });

  const { data: leaveBalances, isLoading: balancesLoading } = useQuery({
    queryKey: ['/api/leave-balances'],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-accent/10 text-accent';
      case 'pending':
        return 'bg-amber-500/10 text-amber-500';
      case 'rejected':
        return 'bg-destructive/10 text-destructive';
      case 'cancelled':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'casual':
        return 'bg-primary';
      case 'sick':
        return 'bg-accent';
      case 'earned':
        return 'bg-blue-500';
      default:
        return 'bg-muted';
    }
  };

  if (leavesLoading || balancesLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {leaveBalances?.map((balance: any) => {
          const used = balance.usedDays || 0;
          const total = balance.totalDays || 0;
          const remaining = total - used;
          const percentage = total > 0 ? (used / total) * 100 : 0;

          const getLeaveTypeDetails = (leaveTypeId: string) => {
            switch (leaveTypeId) {
              case 'casual':
                return {
                  name: 'Casual Leave',
                  icon: Umbrella,
                  color: 'text-primary',
                  bgColor: 'bg-primary/10'
                };
              case 'sick':
                return {
                  name: 'Sick Leave',
                  icon: Thermometer,
                  color: 'text-accent',
                  bgColor: 'bg-accent/10'
                };
              case 'earned':
                return {
                  name: 'Earned Leave',
                  icon: Trophy,
                  color: 'text-blue-500',
                  bgColor: 'bg-blue-500/10'
                };
              default:
                return {
                  name: 'Leave',
                  icon: Calendar,
                  color: 'text-muted-foreground',
                  bgColor: 'bg-muted/10'
                };
            }
          };

          const leaveType = getLeaveTypeDetails(balance.leaveTypeId);
          const Icon = leaveType.icon;

          return (
            <Card key={balance.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${leaveType.bgColor}`}>
                    <Icon className={`w-6 h-6 ${leaveType.color}`} />
                  </div>
                  <span className="text-2xl font-bold text-foreground">{remaining}</span>
                </div>
                <h4 className="font-semibold text-foreground mb-1">{leaveType.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {used} used of {total} allocated
                </p>
                <Progress value={percentage} className="h-2" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Leave History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Leave History</CardTitle>
            <div className="flex items-center gap-3">
              <Select defaultValue="all">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="casual">Casual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="earned">Earned Leave</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="2024">
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {leaves && leaves.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>From Date</TableHead>
                    <TableHead>To Date</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map((leave: any) => (
                    <TableRow key={leave.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className={`w-2 h-2 rounded-full ${getLeaveTypeColor(leave.leaveTypeId)}`}
                          />
                          <span className="text-sm font-medium">
                            {leave.leaveTypeId === 'casual' ? 'Casual Leave' :
                             leave.leaveTypeId === 'sick' ? 'Sick Leave' :
                             leave.leaveTypeId === 'earned' ? 'Earned Leave' : 'Leave'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(leave.fromDate), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(leave.toDate), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {leave.days}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={`${getStatusColor(leave.status)} capitalize`}
                        >
                          {leave.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-primary hover:text-primary/80"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No leave history available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
