'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import InputForm, { InputFormData, ValidationErrors } from '@/components/InputForm';

interface GenerateResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    id: string;
    projectName: string;
    summary: string;
    requirements: Array<{
      id: string;
      category: string;
      title: string;
      description: string;
      priority: string;
    }>;
    generatedAt: string;
  };
  retryAfter?: number;
}

interface CsrfResponse {
  success: boolean;
  csrfToken?: string;
  expiresIn?: number;
}

// Generate a unique session ID for this browser session
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem('specforge_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('specforge_session_id', sessionId);
  }
  return sessionId;
}

export default function Home() {
  const router = useRouter();
  const [formData, setFormData] = useState<InputFormData>({ projectDescription: '', file: null });
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState(''); // Honeypot field - should remain empty

  // Fetch CSRF token on component mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const sessionId = getSessionId();
        const response = await fetch('/api/generate', {
          method: 'GET',
          headers: {
            'X-Session-Id': sessionId,
          },
        });

        if (response.ok) {
          const data: CsrfResponse = await response.json();
          if (data.success && data.csrfToken) {
            setCsrfToken(data.csrfToken);
          }
        }
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      }
    };

    fetchCsrfToken();
  }, []);

  // Handle data changes from InputForm
  const handleDataChange = useCallback((data: InputFormData, errors: ValidationErrors, valid: boolean) => {
    setFormData(data);
    setIsValid(valid);
    setSubmitError(null); // Clear any previous submit errors when user makes changes
  }, []);

  // Handle form submission
  const handleSubmit = async () => {
    if (!isValid || isLoading) return;

    setIsLoading(true);
    setSubmitError(null);

    try {
      // Create FormData for multipart/form-data submission
      const submitData = new FormData();
      submitData.append('projectDescription', formData.projectDescription.trim());

      if (formData.file) {
        submitData.append('file', formData.file);
      }

      // Add security fields
      if (csrfToken) {
        submitData.append('_csrf', csrfToken);
      }
      submitData.append('_timestamp', Date.now().toString());
      submitData.append('website', honeypot); // Honeypot field - bots will fill this

      const sessionId = getSessionId();

      // Make POST request to /api/generate
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'X-Session-Id': sessionId,
        },
        body: submitData,
      });

      const result: GenerateResponse = await response.json();

      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = result.retryAfter || 60;
          throw new Error(`Rate limit exceeded. Please try again in ${retryAfter} seconds.`);
        }

        // Handle CSRF errors
        if (response.status === 403) {
          // Refresh CSRF token and ask user to retry
          setCsrfToken(null);
          throw new Error(result.error || 'Security validation failed. Please try again.');
        }

        throw new Error(result.error || 'Failed to generate specification.');
      }

      if (result.success && result.data) {
        // Store the generated data in sessionStorage for the dashboard
        sessionStorage.setItem('specforge_result', JSON.stringify(result.data));

        // Navigate to dashboard
        router.push('/dashboard');
      } else {
        throw new Error(result.error || 'Unexpected response from server.');
      }
    } catch (error) {
      console.error('Error generating specification:', error);
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 relative overflow-hidden flex flex-col items-center justify-center p-6 selection:bg-orange-500 selection:text-white">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 z-0 opacity-20"
        style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      {/* Glowing Orb Effect */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-orange-600 rounded-full blur-[128px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-amber-600 rounded-full blur-[128px] opacity-20"></div>

      <div className="z-10 w-full max-w-4xl flex flex-col items-center space-y-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-mono font-medium text-orange-300 bg-orange-900/30 rounded-full border border-orange-700/50 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            v1.0 BETA
          </div>

          <h1 className="text-7xl font-extrabold tracking-tight text-white">
            Spec<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">Forge</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            Transform unstructured ideas into engineer-ready specifications.
            <span className="block text-slate-500 mt-2 text-sm">Powered by Large Language Models & Graph Reasoning.</span>
          </p>
        </div>

        {/* Main Input Card */}
        <div className="w-full bg-slate-900/50 backdrop-blur-md rounded-2xl shadow-2xl shadow-black/50 border border-slate-800 overflow-hidden">
          {/* Mac-style Window Header */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>   {/* Close */}
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div> {/* Minimize */}
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div> {/* Maximize */}
          </div>

          <div className="p-8">
            <InputForm onDataChange={handleDataChange} />

            {/* Honeypot field - hidden from real users, bots will fill this */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input
                type="text"
                id="website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {/* Error message */}
            {submitError && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-400">Error</p>
                  <p className="text-sm text-red-300/80">{submitError}</p>
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <button
                onClick={handleSubmit}
                disabled={!isValid || isLoading}
                className={`w-full sm:w-auto group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-orange-500 ${isValid && !isLoading
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg hover:shadow-orange-500/25 hover:scale-[1.02]'
                  : 'bg-slate-700 cursor-not-allowed opacity-60'
                  }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    Generate Specification
                    <svg className={`w-5 h-5 ml-2 -mr-1 transition-transform ${isValid ? 'group-hover:translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}