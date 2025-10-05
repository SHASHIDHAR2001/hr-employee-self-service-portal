import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Edit, Trash2, Eye, UserCheck, Ban, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function LeaveCorrection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leaves, isLoading } = useQuery({
    queryKey: ['/api/leaves'],
  });

  const cancelLeaveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('PUT', `/api/leaves/${id}`, { status: 'cancelled' });
    },
    onSuccess: () => {
      toast({
        title: "Leave Cancelled",
        description: "Your leave request has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/leaves'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
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

  const getLeaveTypeName = (typeId: string) => {
    switch (typeId) {
      case 'casual':
        return 'Casual Leave';
      case 'sick':
        return 'Sick Leave';
      case 'earned':
        return 'Earned Leave';
      default:
        return 'Leave';
    }
  };

  const canEdit = (status: string) => {
    return status === 'pending';
  };

  const canCancel = (status: string) => {
    return status === 'pending' || status === 'approved';
  };

  const filterLeavesByStatus = (status?: string) => {
    if (!leaves) return [];
    if (!status) return leaves;
    return leaves.filter((leave: any) => leave.status === status);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-32 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allLeaves = filterLeavesByStatus();
  const pendingLeaves = filterLeavesByStatus('pending');
  const approvedLeaves = filterLeavesByStatus('approved');
  const cancelledLeaves = filterLeavesByStatus('cancelled');

  const LeaveCard = ({ leave }: { leave: any }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="text-lg font-semibold text-foreground">
                {getLeaveTypeName(leave.leaveTypeId)}
              </h4>
              <Badge className={getStatusColor(leave.status)}>
                {leave.status === 'pending' && 'Pending Approval'}
                {leave.status === 'approved' && 'Approved'}
                {leave.status === 'rejected' && 'Rejected'}
                {leave.status === 'cancelled' && 'Cancelled'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {format(new Date(leave.fromDate), "MMM dd, yyyy")} - {format(new Date(leave.toDate), "MMM dd, yyyy")} 
              ({leave.days} {leave.days === "1" ? "day" : "days"}) • 
              Applied on {format(new Date(leave.appliedAt), "MMM dd, yyyy")}
            </p>
            <div className="bg-muted rounded-lg p-3 mb-4">
              <p className="text-sm text-foreground">
                <strong>Reason:</strong> {leave.reason}
              </p>
            </div>
            {leave.reviewedBy && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <UserCheck className="w-4 h-4" />
                <span>
                  {leave.status === 'approved' ? 'Approved' : 'Reviewed'} by Manager on {' '}
                  {format(new Date(leave.reviewedAt), "MMM dd, yyyy")}
                </span>
              </div>
            )}
            {leave.status === 'cancelled' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Ban className="w-4 h-4" />
                <span>Cancelled on {format(new Date(leave.updatedAt), "MMM dd, yyyy")}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
            {canEdit(leave.status) && (
              <Button variant="ghost" size="sm">
                <Edit className="w-4 h-4 text-primary" />
              </Button>
            )}
            {canCancel(leave.status) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => cancelLeaveMutation.mutate(leave.id)}
                disabled={cancelLeaveMutation.isPending}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>
        
        {canEdit(leave.status) && (
          <div className="flex items-center gap-4">
            <Button className="px-4">
              <Edit className="w-4 h-4 mr-2" />
              Edit Request
            </Button>
            <Button 
              variant="outline" 
              className="px-4 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => cancelLeaveMutation.mutate(leave.id)}
              disabled={cancelLeaveMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Cancel Request
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Manage Leave Requests</CardTitle>
          <p className="text-sm text-muted-foreground">
            Edit or cancel your pending and approved leave requests
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Requests ({allLeaves.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingLeaves.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedLeaves.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({cancelledLeaves.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {allLeaves.length > 0 ? (
            allLeaves.map((leave: any) => (
              <LeaveCard key={leave.id} leave={leave} />
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No leave requests found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingLeaves.length > 0 ? (
            pendingLeaves.map((leave: any) => (
              <LeaveCard key={leave.id} leave={leave} />
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No pending leave requests</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedLeaves.length > 0 ? (
            approvedLeaves.map((leave: any) => (
              <LeaveCard key={leave.id} leave={leave} />
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No approved leave requests</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          {cancelledLeaves.length > 0 ? (
            cancelledLeaves.map((leave: any) => (
              <LeaveCard key={leave.id} leave={leave} />
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No cancelled leave requests</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
