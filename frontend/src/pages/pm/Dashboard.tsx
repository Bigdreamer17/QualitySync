import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { testApi, bugApi, userApi } from '@/lib/apiServices';
import { z } from 'zod';
import type { Bug, DashboardStats, QATester, BugSeverity, BugStatus } from '@/types';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Bug as BugIcon,
  ExternalLink,
  AlertCircle,
  AlertTriangle,
  Flame,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  X,
  Plus,
  FileCheck,
  Loader2,
  AlertOctagon,
} from 'lucide-react';

const convertBugSchema = z.object({
  assigned_to: z.string().min(1, 'Please select a tester'),
  test_case: z.string().min(5, 'Test case must be at least 5 characters'),
  expected_result: z.string().min(5, 'Expected result must be at least 5 characters'),
});

type ConvertBugInput = z.infer<typeof convertBugSchema>;

const createTestSchema = z.object({
  module_platform: z.string().min(1, 'Module/Platform is required'),
  test_case: z.string().min(5, 'Test case must be at least 5 characters'),
  expected_result: z.string().min(5, 'Expected result must be at least 5 characters'),
  assigned_to: z.string().min(1, 'Please select a tester'),
});

type CreateTestInput = z.infer<typeof createTestSchema>;

const severityConfig: Record<BugSeverity, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'warning'; icon: React.ReactNode }> = {
  low: {
    label: 'Low',
    variant: 'secondary',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  medium: {
    label: 'Medium',
    variant: 'warning',
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  high: {
    label: 'High',
    variant: 'destructive',
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  critical: {
    label: 'Critical',
    variant: 'destructive',
    icon: <Flame className="h-3 w-3" />,
  },
};

const statusConfig: Record<BugStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'success' }> = {
  open: {
    label: 'Open',
    variant: 'default',
  },
  in_progress: {
    label: 'In Progress',
    variant: 'secondary',
  },
  resolved: {
    label: 'Resolved',
    variant: 'success',
  },
  closed: {
    label: 'Closed',
    variant: 'outline',
  },
  converted_to_test: {
    label: 'Test Created',
    variant: 'success',
  },
};

export function PMDashboard() {
  const [expandedBugId, setExpandedBugId] = useState<string | null>(null);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [qaTesters, setQaTesters] = useState<QATester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createTestDialogOpen, setCreateTestDialogOpen] = useState(false);
  const [convertBugDialogOpen, setConvertBugDialogOpen] = useState(false);
  const [bugToConvert, setBugToConvert] = useState<Bug | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const convertBugForm = useForm<ConvertBugInput>({
    resolver: zodResolver(convertBugSchema),
    defaultValues: {
      assigned_to: '',
      test_case: '',
      expected_result: '',
    },
  });

  const createTestForm = useForm<CreateTestInput>({
    resolver: zodResolver(createTestSchema),
    defaultValues: {
      module_platform: '',
      test_case: '',
      expected_result: '',
      assigned_to: '',
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch data with individual error handling
      const [statsRes, bugsRes, testersRes] = await Promise.allSettled([
        testApi.getStats(),
        bugApi.getAll({ limit: 50 }),
        userApi.getQATesters(),
      ]);

      // Handle stats
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data.stats);
      } else {
        setStats({
          total_tests: 0,
          passed_tests: 0,
          failed_tests: 0,
          pending_tests: 0,
          escalated_tests: 0,
          open_bugs: 0,
          total_bugs: 0,
        });
      }

      // Handle bugs
      if (bugsRes.status === 'fulfilled') {
        setBugs(bugsRes.value.data.bugs);
      } else {
        setBugs([]);
      }

      // Handle testers
      if (testersRes.status === 'fulfilled') {
        setQaTesters(testersRes.value.data.testers);
      } else {
        setQaTesters([]);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const passRate = stats && stats.total_tests > 0
    ? Math.round((stats.passed_tests / stats.total_tests) * 100)
    : 0;

  const toggleRowExpand = (bugId: string) => {
    setExpandedBugId(expandedBugId === bugId ? null : bugId);
  };

  const openConvertBugDialog = (bug: Bug) => {
    setBugToConvert(bug);
    convertBugForm.reset({
      assigned_to: '',
      test_case: `Verify fix: ${bug.description.slice(0, 100)}`,
      expected_result: 'Bug should be resolved and functionality should work as expected',
    });
    setConvertBugDialogOpen(true);
  };

  const onConvertBug = async (data: ConvertBugInput) => {
    if (!bugToConvert) return;

    setSubmitting(true);
    try {
      await bugApi.convertToTest(bugToConvert.id, {
        assigned_to: data.assigned_to,
        test_case: data.test_case,
        expected_result: data.expected_result,
      });

      // Refresh bugs list
      const bugsRes = await bugApi.getAll({ limit: 50 });
      setBugs(bugsRes.data.bugs);

      // Refresh stats
      const statsRes = await testApi.getStats();
      setStats(statsRes.data.stats);

      setConvertBugDialogOpen(false);
      setBugToConvert(null);
      setExpandedBugId(null);
    } catch (err) {
      console.error('Failed to convert bug:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const onCreateTest = async (data: CreateTestInput) => {
    setSubmitting(true);
    try {
      await testApi.create({
        module_platform: data.module_platform,
        test_case: data.test_case,
        expected_result: data.expected_result,
        assigned_to: data.assigned_to,
      });

      // Refresh stats
      const statsRes = await testApi.getStats();
      setStats(statsRes.data.stats);

      setCreateTestDialogOpen(false);
      createTestForm.reset();
    } catch (err) {
      console.error('Failed to create test:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertOctagon className="h-12 w-12 text-destructive" />
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchData}>Try Again</Button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Tests',
      value: stats?.total_tests || 0,
      icon: ClipboardCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Passed',
      value: stats?.passed_tests || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Failed',
      value: stats?.failed_tests || 0,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Not Tested',
      value: stats?.pending_tests || 0,
      icon: ClipboardList,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
    {
      title: 'Open Bugs',
      value: stats?.open_bugs || 0,
      icon: BugIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your QA testing progress
          </p>
        </div>
        <Button onClick={() => setCreateTestDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Test
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Test Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${passRate}%` }}
                  />
                </div>
              </div>
              <span className="text-2xl font-bold">{passRate}%</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {stats?.passed_tests || 0} of {stats?.total_tests || 0} tests passing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success" className="text-sm px-3 py-1">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {stats?.passed_tests || 0} Passed
              </Badge>
              <Badge variant="destructive" className="text-sm px-3 py-1">
                <XCircle className="h-3 w-3 mr-1" />
                {stats?.failed_tests || 0} Failed
              </Badge>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                <ClipboardList className="h-3 w-3 mr-1" />
                {stats?.pending_tests || 0} Not Tested
              </Badge>
              <Badge variant="warning" className="text-sm px-3 py-1">
                <AlertOctagon className="h-3 w-3 mr-1" />
                {stats?.escalated_tests || 0} Escalated
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reported Bugs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BugIcon className="h-5 w-5" />
              Reported Bugs
            </CardTitle>
            <Badge variant="outline">{bugs.length} total</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Click on a bug to expand and view details. You can create a test case from open bugs.
          </p>
          {bugs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bugs reported yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[250px]">Module/Platform</TableHead>
                  <TableHead className="w-[100px]">Severity</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[120px]">Reported By</TableHead>
                  <TableHead className="w-[80px]">Evidence</TableHead>
                  <TableHead className="w-[100px]">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bugs.map((bug) => {
                  const severity = severityConfig[bug.severity];
                  const status = statusConfig[bug.status];
                  const isExpanded = expandedBugId === bug.id;
                  return (
                    <React.Fragment key={bug.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleRowExpand(bug.id)}
                      >
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpand(bug.id);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{bug.module_platform}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[230px]">
                              {bug.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={severity.variant} className="gap-1">
                            {severity.icon}
                            {severity.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {bug.creator?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {bug.jam_link ? (
                            <a
                              href={bug.jam_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(bug.created_at), 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                      {/* Expanded Bug Detail Row */}
                      {isExpanded && (
                        <TableRow key={`${bug.id}-detail`}>
                          <TableCell colSpan={7} className="bg-muted/30 p-0">
                            <div className="p-6 border-l-4 border-primary">
                              <div className="grid md:grid-cols-2 gap-6">
                                {/* Left Column - Bug Details */}
                                <div className="space-y-4">
                                  <div>
                                    <h3 className="text-lg font-semibold mb-2">{bug.module_platform}</h3>
                                    <div className="flex items-center gap-2 mb-3">
                                      <Badge variant={severity.variant} className="gap-1">
                                        {severity.icon}
                                        {severity.label}
                                      </Badge>
                                      <Badge variant={status.variant}>
                                        {status.label}
                                      </Badge>
                                    </div>
                                  </div>

                                  <div>
                                    <span className="text-sm font-medium">Description</span>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {bug.description}
                                    </p>
                                  </div>

                                  {bug.note && (
                                    <div>
                                      <span className="text-sm font-medium">Notes</span>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {bug.note}
                                      </p>
                                    </div>
                                  )}

                                  <div className="flex flex-wrap gap-4 pt-2">
                                    <div className="flex items-center gap-2 text-sm">
                                      <User className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-muted-foreground">Reported by:</span>
                                      <span className="font-medium">{bug.creator?.name || 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-muted-foreground">Created:</span>
                                      <span className="font-medium">
                                        {format(new Date(bug.created_at), 'PPP')}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Right Column - Evidence */}
                                <div className="space-y-4">
                                  <div>
                                    <span className="text-sm font-medium">Evidence</span>
                                    {bug.jam_link ? (
                                      <div className="mt-2 p-4 bg-background rounded-lg border">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-sm font-medium text-primary">
                                            Jam Recording Available
                                          </span>
                                          <a
                                            href={bug.jam_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-primary/90 transition-colors"
                                          >
                                            View Recording
                                            <ExternalLink className="h-3 w-3" />
                                          </a>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-mono break-all">
                                          {bug.jam_link}
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="mt-2 p-4 bg-background rounded-lg border text-center">
                                        <p className="text-sm text-muted-foreground">
                                          No evidence attached to this bug report
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  <div>
                                    <span className="text-sm font-medium">Timeline</span>
                                    <div className="mt-2 p-4 bg-background rounded-lg border space-y-2">
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Created</span>
                                        <span>{format(new Date(bug.created_at), 'PPp')}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Last Updated</span>
                                        <span>{format(new Date(bug.updated_at), 'PPp')}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                {/* Create Test Button - Only show for open or in_progress bugs */}
                                {(bug.status === 'open' || bug.status === 'in_progress') && (
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openConvertBugDialog(bug);
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Create Test from Bug
                                  </Button>
                                )}
                                {bug.status === 'converted_to_test' && (
                                  <div className="flex items-center gap-2 text-green-600">
                                    <FileCheck className="h-4 w-4" />
                                    <span className="text-sm font-medium">Test case created</span>
                                  </div>
                                )}
                                {bug.status !== 'open' && bug.status !== 'in_progress' && bug.status !== 'converted_to_test' && (
                                  <div />
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleRowExpand(bug.id);
                                  }}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Close Details
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Test Dialog */}
      <Dialog open={createTestDialogOpen} onOpenChange={setCreateTestDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Test Case
            </DialogTitle>
            <DialogDescription>
              Add a new test case to the master list and assign it to a QA tester.
            </DialogDescription>
          </DialogHeader>

          <Form {...createTestForm}>
            <form onSubmit={createTestForm.handleSubmit(onCreateTest)} className="space-y-4">
              <FormField
                control={createTestForm.control}
                name="module_platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module/Platform</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Authentication, Dashboard, Mobile App" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createTestForm.control}
                name="test_case"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Case Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this test case should verify..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createTestForm.control}
                name="expected_result"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Result</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What is the expected outcome when this test passes..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createTestForm.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Tester</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a QA tester" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {qaTesters.map((tester) => (
                          <SelectItem key={tester.id} value={tester.id}>
                            {tester.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateTestDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Create Test
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Convert Bug to Test Dialog */}
      <Dialog open={convertBugDialogOpen} onOpenChange={setConvertBugDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Test from Bug
            </DialogTitle>
            <DialogDescription>
              This will create a new test case from the bug report and mark the bug as "Test Created".
            </DialogDescription>
          </DialogHeader>

          {bugToConvert && (
            <div className="my-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">{bugToConvert.module_platform}</h4>
              <p className="text-sm text-muted-foreground mb-2">{bugToConvert.description}</p>
              <div className="flex gap-2">
                <Badge variant={severityConfig[bugToConvert.severity].variant} className="gap-1">
                  {severityConfig[bugToConvert.severity].icon}
                  {severityConfig[bugToConvert.severity].label}
                </Badge>
              </div>
            </div>
          )}

          <Form {...convertBugForm}>
            <form onSubmit={convertBugForm.handleSubmit(onConvertBug)} className="space-y-4">
              <FormField
                control={convertBugForm.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Tester</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a QA tester" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {qaTesters.map((tester) => (
                          <SelectItem key={tester.id} value={tester.id}>
                            {tester.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={convertBugForm.control}
                name="test_case"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Case Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what needs to be tested"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={convertBugForm.control}
                name="expected_result"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Result</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What should happen when the test passes"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setConvertBugDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-1" />
                  )}
                  Create Test
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
