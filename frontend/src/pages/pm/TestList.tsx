import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DialogTrigger,
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
import { Textarea } from '@/components/ui/textarea';
import { testApi, userApi } from '@/lib/apiServices';
import { z } from 'zod';
import type { TestCase, TestStatus, QATester, Pagination } from '@/types';
import {
  Plus,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  ExternalLink,
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';

const createTestSchema = z.object({
  module_platform: z.string().min(1, 'Module/Platform is required'),
  test_case: z.string().min(5, 'Test case must be at least 5 characters'),
  expected_result: z.string().min(5, 'Expected result must be at least 5 characters'),
  evidence_url: z.string().url().optional().or(z.literal('')),
  assigned_to: z.string().min(1, 'Please select a tester'),
});

type CreateTestInput = z.infer<typeof createTestSchema>;

const statusConfig: Record<TestStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'; icon: React.ReactNode }> = {
  pass: {
    label: 'Pass',
    variant: 'success',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  fail: {
    label: 'Fail',
    variant: 'destructive',
    icon: <XCircle className="h-3 w-3" />,
  },
  pending: {
    label: 'Not Tested',
    variant: 'secondary',
    icon: <ClipboardList className="h-3 w-3" />,
  },
  escalated: {
    label: 'Escalated',
    variant: 'warning',
    icon: <AlertTriangle className="h-3 w-3" />,
  },
};

export function TestList() {
  const [tests, setTests] = useState<TestCase[]>([]);
  const [qaTesters, setQaTesters] = useState<QATester[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const form = useForm<CreateTestInput>({
    resolver: zodResolver(createTestSchema),
    defaultValues: {
      module_platform: '',
      test_case: '',
      expected_result: '',
      evidence_url: '',
      assigned_to: '',
    },
  });

  useEffect(() => {
    fetchData();
  }, [currentPage, searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [testsRes, testersRes] = await Promise.allSettled([
        testApi.getAll({
          page: currentPage,
          limit: 10,
          search: searchQuery || undefined,
        }),
        userApi.getQATesters(),
      ]);

      // Handle tests
      if (testsRes.status === 'fulfilled') {
        setTests(testsRes.value.data.tests);
        setPagination(testsRes.value.data.pagination);
      } else {
        setTests([]);
        setPagination(null);
      }

      // Handle testers
      if (testersRes.status === 'fulfilled') {
        setQaTesters(testersRes.value.data.testers);
      } else {
        setQaTesters([]);
      }
    } catch (err) {
      setError('Failed to load tests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CreateTestInput) => {
    setSubmitting(true);
    try {
      await testApi.create({
        module_platform: data.module_platform,
        test_case: data.test_case,
        expected_result: data.expected_result,
        evidence_url: data.evidence_url || undefined,
        assigned_to: data.assigned_to,
      });

      await fetchData();
      setDialogOpen(false);
      form.reset();
    } catch (err) {
      console.error('Failed to create test:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  if (loading && tests.length === 0) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Master Test List</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all test cases
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Test
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Create New Test Case</DialogTitle>
              <DialogDescription>
                Add a new test case to the master list. All fields are required.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="module_platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Module/Platform *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Authentication, Dashboard, Mobile App" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="test_case"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Case *</FormLabel>
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
                  control={form.control}
                  name="expected_result"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Result *</FormLabel>
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
                  control={form.control}
                  name="evidence_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Evidence URL (Jam.dev link)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://jam.dev/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To *</FormLabel>
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
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
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
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by module, test case, or assignee..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="max-w-md"
        />
        <span className="text-sm text-muted-foreground">
          {pagination?.total || 0} test{pagination?.total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Test Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Module/Platform</TableHead>
              <TableHead className="w-[250px]">Test Case</TableHead>
              <TableHead className="w-[200px]">Expected Result</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[120px]">Assigned To</TableHead>
              <TableHead className="w-[80px]">Evidence</TableHead>
              <TableHead className="w-[100px]">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <ClipboardList className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No test cases yet</h3>
                    <p className="text-muted-foreground mb-4 max-w-sm">
                      Get started by creating your first test case. Tests help track QA progress and ensure quality.
                    </p>
                    <Button onClick={() => setDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Test
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tests.map((test) => {
                const status = statusConfig[test.status];
                return (
                  <TableRow key={test.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">
                        {test.module_platform}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium line-clamp-2">{test.test_case}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {test.expected_result}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="gap-1">
                        {status.icon}
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{test.assignee?.name || 'Unassigned'}</span>
                    </TableCell>
                    <TableCell>
                      {test.evidence_url ? (
                        <a
                          href={test.evidence_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          View
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(test.updated_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage === pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
