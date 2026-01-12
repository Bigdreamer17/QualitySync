import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { bugApi } from '@/lib/apiServices';
import { z } from 'zod';
import type { BugSeverity } from '@/types';
import { Bug, CheckCircle2, AlertTriangle, AlertCircle, Flame, Loader2 } from 'lucide-react';

const reportBugSchema = z.object({
  module_platform: z.string().min(1, 'Module/Platform is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  jam_link: z.string().url('Must be a valid URL').refine(
    (val) => val.includes('jam.dev'),
    'Must be a jam.dev link'
  ),
  note: z.string().optional(),
});

type ReportBugInput = z.infer<typeof reportBugSchema>;

const severityConfig: Record<BugSeverity, { label: string; icon: React.ReactNode; description: string; className: string }> = {
  low: {
    label: 'Low',
    icon: <AlertCircle className="h-4 w-4" />,
    description: 'Minor issue, cosmetic',
    className: 'border-green-500 bg-green-50 text-green-700 hover:bg-green-100',
  },
  medium: {
    label: 'Medium',
    icon: <AlertTriangle className="h-4 w-4" />,
    description: 'Affects some users',
    className: 'border-yellow-500 bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
  },
  high: {
    label: 'High',
    icon: <AlertTriangle className="h-4 w-4" />,
    description: 'Major functionality broken',
    className: 'border-orange-500 bg-orange-50 text-orange-700 hover:bg-orange-100',
  },
  critical: {
    label: 'Critical',
    icon: <Flame className="h-4 w-4" />,
    description: 'System down, data loss',
    className: 'border-red-500 bg-red-50 text-red-700 hover:bg-red-100',
  },
};

export function ReportBug() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ReportBugInput>({
    resolver: zodResolver(reportBugSchema),
    defaultValues: {
      module_platform: '',
      description: '',
      severity: 'medium',
      jam_link: '',
      note: '',
    },
  });

  const onSubmit = async (data: ReportBugInput) => {
    setSubmitting(true);
    setError(null);

    try {
      await bugApi.create({
        module_platform: data.module_platform,
        description: data.description,
        severity: data.severity,
        jam_link: data.jam_link,
        note: data.note || undefined,
      });

      setSubmitted(true);

      // Reset after showing success
      setTimeout(() => {
        setSubmitted(false);
        form.reset();
      }, 3000);
    } catch (err) {
      console.error('Failed to submit bug:', err);
      setError('Failed to submit bug report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Bug Reported Successfully</h2>
            <p className="text-muted-foreground">
              Your bug report has been submitted and will be reviewed by the PM team.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">Report Unlisted Bug</h1>
        <p className="text-muted-foreground mt-1">
          Found a bug not related to a specific test case? Report it here.
        </p>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Bug Report Form
            </CardTitle>
            <CardDescription>
              Provide as much detail as possible to help the engineering team investigate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-lg">
                {error}
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="module_platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Module/Platform</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Authentication, Dashboard, Mobile App"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-2">
                          {(Object.keys(severityConfig) as BugSeverity[]).map((severity) => {
                            const config = severityConfig[severity];
                            const isSelected = field.value === severity;
                            return (
                              <button
                                key={severity}
                                type="button"
                                onClick={() => field.onChange(severity)}
                                className={`p-3 rounded-lg border-2 text-left transition-all ${
                                  isSelected
                                    ? config.className + ' ring-2 ring-offset-2 ring-current'
                                    : 'border-border hover:border-muted-foreground'
                                }`}
                              >
                                <div className="flex items-center gap-2 font-medium">
                                  {config.icon}
                                  {config.label}
                                </div>
                                <p className="text-xs mt-1 opacity-80">{config.description}</p>
                              </button>
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the bug in detail. Include steps to reproduce, expected behavior, and actual behavior."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="jam_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jam Link (Evidence)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://jam.dev/c/..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Required. Must be a jam.dev link showing the bug.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional context, workarounds, or related information..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => form.reset()}>
                    Clear Form
                  </Button>
                  <Button type="submit" className="flex-1" disabled={submitting}>
                    {submitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Bug className="h-4 w-4 mr-2" />
                    )}
                    Submit Bug Report
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">Tips for a Good Bug Report</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>- Be specific about steps to reproduce the issue</p>
            <p>- Include browser/device information if relevant</p>
            <p>- Attach a Jam recording showing the bug in action</p>
            <p>- Note if the bug is intermittent or consistent</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
