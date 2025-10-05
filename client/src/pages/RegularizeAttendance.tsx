import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { Check, Home, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";

const regularizeSchema = z.object({
  date: z.string().min(1, "Date is required"),
  status: z.enum(["wfh", "leave", "outdoor"], {
    required_error: "Please select a regularization type",
  }),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
});

type RegularizeForm = z.infer<typeof regularizeSchema>;

export default function RegularizeAttendance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAbsentDates, setSelectedAbsentDates] = useState<string[]>([]);

  const form = useForm<RegularizeForm>({
    resolver: zodResolver(regularizeSchema),
    defaultValues: {
      date: "",
      status: undefined,
      reason: "",
    },
  });

  const { data: absentDates, isLoading } = useQuery({
    queryKey: ['/api/attendance/absent-dates', { days: 7 }],
  });

  const regularizeMutation = useMutation({
    mutationFn: async (data: RegularizeForm) => {
      return await apiRequest('POST', '/api/attendance/regularize', data);
    },
    onSuccess: () => {
      toast({
        title: "Attendance Regularized",
        description: "Your attendance has been regularized successfully.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/absent-dates'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegularizeForm) => {
    regularizeMutation.mutate(data);
  };

  const toggleAbsentDate = (date: string) => {
    setSelectedAbsentDates(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date]
    );
  };

  const regularizationTypes = [
    {
      value: "wfh",
      title: "Work from Home",
      description: "Mark as WFH",
      icon: Home,
      color: "text-blue-500"
    },
    {
      value: "leave",
      title: "Apply Leave",
      description: "Convert to leave",
      icon: Calendar,
      color: "text-primary"
    },
    {
      value: "outdoor",
      title: "Outdoor Duty",
      description: "Client/field visit",
      icon: MapPin,
      color: "text-accent"
    }
  ];

  if (isLoading) {
    return (
      <div className="max-w-4xl">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Regularize Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Date Selection */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Date(s) <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      You can only regularize dates from the last 7 days
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Recent Absent Dates */}
              {absentDates && absentDates.length > 0 && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold text-foreground mb-3">Recent Absent Dates</h4>
                    <div className="space-y-2">
                      {absentDates.map((record: any) => (
                        <div 
                          key={record.id} 
                          className="flex items-center justify-between p-3 bg-card rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={selectedAbsentDates.includes(record.date)}
                              onCheckedChange={() => toggleAbsentDate(record.date)}
                            />
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {format(new Date(record.date), "MMMM dd, yyyy")}
                              </p>
                              <p className="text-xs text-destructive">Absent - Not marked</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(record.date), "EEEE")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Regularization Type */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regularization Type <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        className="grid grid-cols-1 md:grid-cols-3 gap-3"
                      >
                        {regularizationTypes.map((type) => {
                          const Icon = type.icon;
                          return (
                            <div key={type.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={type.value} id={type.value} />
                              <Label 
                                htmlFor={type.value}
                                className="flex items-center gap-3 p-4 border border-input rounded-lg cursor-pointer hover:border-primary transition-colors flex-1"
                              >
                                <Icon className={`w-5 h-5 ${type.color}`} />
                                <div>
                                  <p className="font-medium text-sm">{type.title}</p>
                                  <p className="text-xs text-muted-foreground">{type.description}</p>
                                </div>
                              </Label>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        placeholder="Explain why you need to regularize attendance..."
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex items-center gap-4">
                <Button 
                  type="submit" 
                  disabled={regularizeMutation.isPending}
                  className="px-6"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {regularizeMutation.isPending ? "Submitting..." : "Submit Regularization"}
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
