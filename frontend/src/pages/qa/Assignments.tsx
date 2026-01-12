import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { testApi } from '@/lib/apiServices';
import { z } from 'zod';
import type { TestCase, TestStatus } from '@/types';
import {
  CheckCircle2,
  XCircle,
  ClipboardList,
  AlertOctagon,
  Play,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  User,
  Calendar,
  Loader2,
} from 'lucide-react';

const updateTestResultSchema = z.object({
  status: z.enum(['pass', 'fail', 'escalated']),
  evidence_url: z.string().optional(),
  notes: z.string().optional(),
});

type UpdateTestResultInput = z.infer<typeof updateTestResultSchema>;

const statusConfig: Record<TestStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'; icon: React.ReactNode; color: string }> = {
  pass: {
    label: 'Pass',
    variant: 'success',
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: 'bg-green-500 hover:bg-green-600 text-white',
  },
  fail: {
    label: 'Fail',
    variant: 'destructive',
    icon: <XCircle className="h-4 w-4" />,
    color: 'bg-red-500 hover:bg-red-600 text-white',
  },
  pending: {
    label: 'Not Tested',
    variant: 'secondary',
    icon: <ClipboardList className="h-4 w-4" />,
    color: 'bg-gray-500 hover:bg-gray-600 text-white',
  },
  escalated: {
    label: 'Escalated',
    variant: 'warning',
    icon: <AlertOctagon className="h-4 w-4" />,
    color: 'bg-orange-500 hover:bg-orange-600 text-white',
  },
};

export function QAAssignments() {
  const [tests, setTests] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<TestCase | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<UpdateTestResultInput>({
    resolver: zodResolver(updateTestResultSchema),
    defaultValues: {
      status: 'pass',
      evidence_url: '',
      notes: '',
    },
  });

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await testApi.getAll({ limit: 100 });
      setTests(response.data.tests);
    } catch (err) {
      setError('Failed to load assignments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openUpdateDialog = (test: TestCase) => {
    setSelectedTest(test);
    form.reset({
      status: test.status === 'pending' ? 'pass' : test.status as 'pass' | 'fail' | 'escalated',
      evidence_url: test.evidence_url || '',
      notes: test.notes || '',
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: UpdateTestResultInput) => {
    if (!selectedTest) return;

    setSubmitting(true);
    try {
      await testApi.updateResult(selectedTest.id, {
        status: data.status,
        evidence_url: data.evidence_url || undefined,
        notes: data.notes || undefined,
      });

      await fetchTests();
      setDialogOpen(false);
      setSelectedTest(null);
      form.reset();
    } catch (err) {
      console.error('Failed to update test result:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpand = (testId: string) => {
    setExpandedTestId(expandedTestId === testId ? null : testId);
  };

  // Apply search filter
  const filteredTests = tests.filter(
    (test) =>
      test.test_case.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.module_platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.expected_result.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (test.notes || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingTests = filteredTests.filter((t) => t.status === 'pending');
  const completedTests = filteredTests.filter((t) => t.status === 'pass' || t.status === 'fail' || t.status === 'escalated');

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
        <Button onClick={fetchTests}>Try Again</Button>
      </div>
    );
  }

  const TestCard = ({ test }: { test: TestCase }) => {
    const status = statusConfig[test.status];
    const isExpanded = expandedTestId === test.id;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <Badge variant="outline" className="mb-2">{test.module_platform}</Badge>
              <CardTitle className="text-base font-medium">{test.test_case}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={status.variant} className="gap-1 flex-shrink-0">
                {status.icon}
                {status.label}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => toggleExpand(test.id)}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-sm font-medium">Expected Result:</span>
            <p className="text-sm text-muted-foreground mt-1">{test.expected_result}</p>
          </div>

          {/* Show source bug info if this test was created from a bug */}
          {test.source_bug_id && test.source_bug && (
            <div className="p-3 bg-muted/50 rounded-lg border">
              <span className="text-xs font-medium text-muted-foreground">Created from bug report</span>
              <p className="text-sm mt-1">
                Originally reported by: {test.source_bug.bug_creator?.name || 'Unknown'}
              </p>
            </div>
          )}

          {/* Expandable Details Section */}
          {isExpanded && (
            <div className="border-t pt-4 mt-4 space-y-4">
              {/* Evidence */}
              <div>
                <span className="text-sm font-medium">Evidence:</span>
                {test.evidence_url ? (
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-primary font-medium">Jam Recording</span>
                      <a
                        href={test.evidence_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-mono break-all">
                      {test.evidence_url}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">No evidence attached yet</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <span className="text-sm font-medium">Notes:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {test.notes || 'No notes added yet'}
                </p>
              </div>

              {/* Meta Information */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Created by {test.creator?.name || 'Unknown'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Created {format(new Date(test.created_at), 'PPP')}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Updated {format(new Date(test.updated_at), 'PPP')}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              Updated {format(new Date(test.updated_at), 'MMM d, yyyy')}
            </span>
            <Button size="sm" onClick={() => openUpdateDialog(test)}>
              <Play className="h-3 w-3 mr-1" />
              {test.status === 'pending' ? 'Start Test' : 'Update Result'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Assignments</h1>
          <p className="text-muted-foreground mt-1">
            Test cases assigned to you for verification
          </p>
        </div>
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Not Tested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tests.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Not Tested ({pendingTests.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedTests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingTests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No tests to review. Great job!
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingTests.map((test) => (
                <TestCard key={test.id} test={test} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {completedTests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No completed tests yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {completedTests.map((test) => (
                <TestCard key={test.id} test={test} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Update Result Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Test Result</DialogTitle>
            <DialogDescription>
              {selectedTest?.test_case}
            </DialogDescription>
          </DialogHeader>

          {/* Show test details in the dialog */}
          {selectedTest && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm">
                <span className="font-medium">Module: </span>
                <span className="text-muted-foreground">{selectedTest.module_platform}</span>
              </div>
              <div className="text-sm mt-1">
                <span className="font-medium">Expected: </span>
                <span className="text-muted-foreground">{selectedTest.expected_result}</span>
              </div>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Result</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-3 gap-2">
                        {(['pass', 'fail', 'escalated'] as const).map((status) => {
                          const config = statusConfig[status];
                          const isSelected = field.value === status;
                          return (
                            <Button
                              key={status}
                              type="button"
                              variant="outline"
                              className={`flex-1 ${isSelected ? config.color : ''}`}
                              onClick={() => field.onChange(status)}
                            >
                              {config.icon}
                              <span className="ml-1">{config.label}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="evidence_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evidence URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://jam.dev/c/..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Must be a jam.dev link
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any relevant notes about the test result..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Save Result
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
