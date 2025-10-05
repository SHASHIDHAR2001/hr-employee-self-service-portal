import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertLeaveSchema } from "@shared/schema";
import { z } from "zod";
import { Send, Upload } from "lucide-react";

const applyLeaveSchema = insertLeaveSchema.extend({
  contactNumber: z.string().optional(),
  isHalfDay: z.boolean().optional(),
});

type ApplyLeaveForm = z.infer<typeof applyLeaveSchema>;

export default function ApplyLeave() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isHalfDay, setIsHalfDay] = useState(false);

  const form = useForm<ApplyLeaveForm>({
    resolver: zodResolver(applyLeaveSchema),
    defaultValues: {
      leaveTypeId: "",
      fromDate: "",
      toDate: "",
      reason: "",
      contactNumber: "",
      isHalfDay: false,
    },
  });

  const { data: leaveTypes = [] } = useQuery<any[]>({
    queryKey: ['/api/leave-types'],
  });

  const { data: leaveBalances = [] } = useQuery<any[]>({
    queryKey: ['/api/leave-balances'],
  });

  const applyLeaveMutation = useMutation({
    mutationFn: async (data: ApplyLeaveForm) => {
      return await apiRequest('POST', '/api/leaves', data);
    },
    onSuccess: () => {
      toast({
        title: "Leave Applied",
        description: "Your leave request has been submitted successfully.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/leaves'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ApplyLeaveForm) => {
    applyLeaveMutation.mutate(data);
  };

  const calculateDays = () => {
    const fromDate = form.getValues("fromDate");
    const toDate = form.getValues("toDate");
    
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      const timeDiff = to.getTime() - from.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      return isHalfDay ? 0.5 : daysDiff;
    }
    return 0;
  };

  const days = calculateDays();

  return (
    <div className="max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Apply for Leave</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Leave Type */}
              <FormField
                control={form.control}
                name="leaveTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leave Type <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leaveTypes?.map((type: any) => {
                          const balance = leaveBalances?.find((b: any) => b.leaveTypeId === type.id);
                          const remaining = balance ? balance.totalDays - balance.usedDays : 0;
                          return (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name} ({remaining} remaining)
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fromDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Date <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="toDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Date <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Half Day Option */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="half-day" 
                  checked={isHalfDay}
                  onCheckedChange={(checked) => setIsHalfDay(checked === true)}
                  data-testid="checkbox-half-day"
                />
                <Label htmlFor="half-day" className="text-sm cursor-pointer">
                  This is a half-day leave
                </Label>
              </div>

              {/* Reason */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={4} 
                        placeholder="Please provide a reason for your leave..."
                        className="resize-none"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Minimum 10 characters required</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact Number */}
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number During Leave</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="tel" 
                        placeholder="+1 (555) 000-0000"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Leave Summary */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <h4 className="font-semibold text-foreground mb-3">Leave Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Days:</span>
                      <span className="font-medium text-foreground">{days}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Working Days:</span>
                      <span className="font-medium text-foreground">{days}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <Button 
                  type="submit" 
                  disabled={applyLeaveMutation.isPending}
                  className="px-6"
                  data-testid="button-submit-leave"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {applyLeaveMutation.isPending ? "Submitting..." : "Submit Leave Request"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => form.reset()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
