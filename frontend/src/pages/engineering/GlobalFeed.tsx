import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { testApi, bugApi } from '@/lib/apiServices';
import type { TestCase, Bug, BugSeverity, BugStatus } from '@/types';
import {
  XCircle,
  AlertTriangle,
  AlertCircle,
  Flame,
  ExternalLink,
  ClipboardCheck,
  Bug as BugIcon,
  Search,
  Filter,
  User,
  Calendar,
  AlertOctagon,
  Loader2,
} from 'lucide-react';

const testStatusConfig: Record<'fail' | 'escalated', { label: string; variant: 'destructive' | 'warning'; icon: React.ReactNode; bgColor: string }> = {
  fail: {
    label: 'Fail',
    variant: 'destructive',
    icon: <XCircle className="h-4 w-4" />,
    bgColor: 'bg-red-100',
  },
  escalated: {
    label: 'Escalated',
    variant: 'warning',
    icon: <AlertOctagon className="h-4 w-4" />,
    bgColor: 'bg-orange-100',
  },
};

const severityConfig: Record<BugSeverity, { label: string; variant: 'secondary' | 'warning' | 'destructive'; icon: React.ReactNode }> = {
  low: {
    label: 'Low',
    variant: 'secondary',
    icon: <AlertCircle className="h-4 w-4" />,
  },
  medium: {
    label: 'Medium',
    variant: 'warning',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  high: {
    label: 'High',
    variant: 'destructive',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  critical: {
    label: 'Critical',
    variant: 'destructive',
    icon: <Flame className="h-4 w-4" />,
  },
};

const bugStatusConfig: Record<BugStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'success' }> = {
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

export function GlobalFeed() {
  const [tests, setTests] = useState<TestCase[]>([]);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [testsRes, bugsRes] = await Promise.all([
        testApi.getAll({ limit: 100 }),
        bugApi.getAll({ limit: 100 }),
      ]);

      // Backend already filters to show only fail/escalated for ENG role
      setTests(testsRes.data.tests);
      setBugs(bugsRes.data.bugs);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Apply search filter
  const filteredTests = tests.filter(
    (test) =>
      test.test_case.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.module_platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (test.notes || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBugs = bugs.filter(
    (bug) =>
      bug.module_platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bug.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bug.note || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Count items with evidence
  const testsWithEvidence = filteredTests.filter((test) => test.evidence_url);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Engineering Feed</h1>
        <p className="text-muted-foreground mt-1">
          View failed and escalated tests along with bug reports.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filteredTests.filter((t) => t.status === 'fail').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Escalated Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {filteredTests.filter((t) => t.status === 'escalated').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bug Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{filteredBugs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              With Evidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{testsWithEvidence.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tests and bugs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Feed Tabs */}
      <Tabs defaultValue="tests">
        <TabsList>
          <TabsTrigger value="tests">
            Failed/Escalated Tests ({filteredTests.length})
          </TabsTrigger>
          <TabsTrigger value="bugs">Bug Reports ({filteredBugs.length})</TabsTrigger>
        </TabsList>

        {/* Failed/Escalated Tests Tab */}
        <TabsContent value="tests" className="mt-4 space-y-4">
          {filteredTests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No failed or escalated tests found.
              </CardContent>
            </Card>
          ) : (
            filteredTests.map((test) => {
              const statusConfig = testStatusConfig[test.status as 'fail' | 'escalated'];
              if (!statusConfig) return null;
              return (
                <Card key={test.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
                          <ClipboardCheck className={`h-4 w-4 ${test.status === 'fail' ? 'text-red-600' : 'text-orange-600'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-base font-medium">
                              {test.test_case}
                            </CardTitle>
                            <Badge variant={statusConfig.variant} className="gap-1">
                              {statusConfig.icon}
                              {statusConfig.label}
                            </Badge>
                            <Badge variant="outline">{test.module_platform}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Expected: {test.expected_result}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Evidence Link */}
                    {test.evidence_url && (
                      <div className="bg-muted/50 rounded-lg p-3 border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Evidence (Jam Recording)</span>
                          <a
                            href={test.evidence_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium"
                          >
                            View Recording
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          {test.evidence_url}
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    {test.notes && (
                      <div>
                        <span className="text-sm font-medium">Notes:</span>
                        <p className="text-sm text-muted-foreground mt-1">{test.notes}</p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Tested by {test.assignee?.name || 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(test.updated_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Bug Reports Tab */}
        <TabsContent value="bugs" className="mt-4 space-y-4">
          {filteredBugs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No bug reports found matching your search.
              </CardContent>
            </Card>
          ) : (
            filteredBugs.map((bug) => {
              const severity = severityConfig[bug.severity];
              const status = bugStatusConfig[bug.status];
              return (
                <Card key={bug.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-red-100">
                          <BugIcon className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-base font-medium">
                              {bug.module_platform}
                            </CardTitle>
                            <Badge variant={severity.variant} className="gap-1">
                              {severity.icon}
                              {severity.label}
                            </Badge>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {bug.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Evidence Link */}
                    {bug.jam_link && (
                      <div className="bg-muted/50 rounded-lg p-3 border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Evidence (Jam Recording)</span>
                          <a
                            href={bug.jam_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium"
                          >
                            View Recording
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          {bug.jam_link}
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    {bug.note && (
                      <div>
                        <span className="text-sm font-medium">Notes:</span>
                        <p className="text-sm text-muted-foreground mt-1">{bug.note}</p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Reported by {bug.creator?.name || 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(bug.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Info Banner */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Engineering View</p>
              <p className="text-xs text-muted-foreground">
                Showing failed and escalated tests, plus all bug reports.
                Click on Jam recordings to view detailed bug reproductions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
