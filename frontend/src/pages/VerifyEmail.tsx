import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

type VerificationStatus = 'verifying' | 'success' | 'error';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [error, setError] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    const verify = async () => {
      if (!token || !verifyEmail) {
        setStatus('error');
        setError('Invalid verification link');
        return;
      }

      try {
        await verifyEmail(token);
        setStatus('success');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to verify email');
      }
    };

    verify();
  }, [token, verifyEmail, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">QS</span>
            </div>
            <span className="font-bold text-2xl">QualitySync</span>
          </div>
          <p className="text-muted-foreground">QA Management System</p>
        </div>

        <Card>
          <CardContent className="py-8 text-center">
            {status === 'verifying' && (
              <>
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Verifying Email</h2>
                <p className="text-muted-foreground">
                  Please wait while we verify your email address...
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Email Verified</h2>
                <p className="text-muted-foreground">
                  Your email has been verified successfully. Redirecting to sign in...
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Verification Failed</h2>
                <p className="text-muted-foreground mb-4">
                  {error || 'Unable to verify your email. The link may have expired.'}
                </p>
                <Link to="/login">
                  <Button>Go to Sign In</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {status !== 'verifying' && (
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
