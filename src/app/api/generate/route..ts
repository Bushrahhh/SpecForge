import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limiting store (for production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// CSRF token store (for production, use Redis or database)
const csrfTokenStore = new Map<string, { token: string; expiresAt: number }>();

// Rate limit configuration
const RATE_LIMIT_MAX_REQUESTS = 10; // Maximum requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window

// CSRF token configuration
const CSRF_TOKEN_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

// Allowed origins for CORS/Origin validation
const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'https://localhost:3000',
    // Add production domain here
];

// Generate a secure random token
function generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Validate origin header to prevent CSRF attacks
function validateOrigin(request: NextRequest): boolean {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    // In development, allow requests without origin (like from API clients)
    if (process.env.NODE_ENV === 'development') {
        return true;
    }

    // Check origin header
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        return true;
    }

    // Fallback to referer check
    if (referer) {
        try {
            const refererUrl = new URL(referer);
            const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
            return ALLOWED_ORIGINS.includes(refererOrigin);
        } catch {
            return false;
        }
    }

    return false;
}

// Validate CSRF token
function validateCsrfToken(sessionId: string, token: string): boolean {
    const stored = csrfTokenStore.get(sessionId);
    if (!stored) return false;

    // Check if token is expired
    if (Date.now() > stored.expiresAt) {
        csrfTokenStore.delete(sessionId);
        return false;
    }

    // Constant-time comparison to prevent timing attacks
    if (stored.token.length !== token.length) return false;
    let result = 0;
    for (let i = 0; i < stored.token.length; i++) {
        result |= stored.token.charCodeAt(i) ^ token.charCodeAt(i);
    }
    return result === 0;
}

function getRateLimitKey(request: NextRequest): string {
    // Use IP address or forwarded IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    return `rate_limit_${ip}`;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const record = rateLimitStore.get(key);

    // Clean up expired entries
    if (record && now > record.resetTime) {
        rateLimitStore.delete(key);
    }

    const currentRecord = rateLimitStore.get(key);

    if (!currentRecord) {
        // First request in this window
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW_MS,
        });
        return {
            allowed: true,
            remaining: RATE_LIMIT_MAX_REQUESTS - 1,
            resetIn: RATE_LIMIT_WINDOW_MS,
        };
    }

    if (currentRecord.count >= RATE_LIMIT_MAX_REQUESTS) {
        // Rate limit exceeded
        return {
            allowed: false,
            remaining: 0,
            resetIn: currentRecord.resetTime - now,
        };
    }

    // Increment count
    currentRecord.count += 1;
    rateLimitStore.set(key, currentRecord);

    return {
        allowed: true,
        remaining: RATE_LIMIT_MAX_REQUESTS - currentRecord.count,
        resetIn: currentRecord.resetTime - now,
    };
}

// Allowed file types
const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

// Minimum text length to prevent honeypots/bots
const MIN_TEXT_LENGTH = 50;
const MAX_TEXT_LENGTH = 10000;

export async function POST(request: NextRequest) {
    try {
        // 1. Origin validation (CSRF protection)
        if (!validateOrigin(request)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid request origin. CSRF protection triggered.',
                },
                { status: 403 }
            );
        }

        // 2. Rate limiting check
        const rateLimitKey = getRateLimitKey(request);
        const rateLimit = checkRateLimit(rateLimitKey);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Rate limit exceeded. Please try again later.',
                    retryAfter: Math.ceil(rateLimit.resetIn / 1000),
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': Math.ceil(rateLimit.resetIn / 1000).toString(),
                        'Retry-After': Math.ceil(rateLimit.resetIn / 1000).toString(),
                    },
                }
            );
        }

        // 3. Parse the form data
        const formData = await request.formData();
        const projectDescription = formData.get('projectDescription') as string;
        const file = formData.get('file') as File | null;

        // 4. CSRF Token validation
        const csrfToken = formData.get('_csrf') as string;
        const sessionId = request.headers.get('x-session-id') || rateLimitKey;

        if (csrfToken && !validateCsrfToken(sessionId, csrfToken)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid or expired security token. Please refresh the page.',
                },
                { status: 403 }
            );
        }

        // 5. Honeypot field check - if filled, it's likely a bot
        const honeypot = formData.get('website') as string; // Hidden field bots might fill
        if (honeypot && honeypot.trim().length > 0) {
            // Silently reject bot submissions (don't reveal it's a honeypot)
            // Log for monitoring but return success to confuse bots
            console.warn('Honeypot triggered - potential bot submission');
            return NextResponse.json(
                {
                    success: true,
                    message: 'Specification generated successfully.',
                    data: { id: 'blocked' },
                },
                { status: 200 }
            );
        }

        // 6. Timestamp validation - prevent replay attacks
        const timestamp = formData.get('_timestamp') as string;
        if (timestamp) {
            const submissionTime = parseInt(timestamp, 10);
            const now = Date.now();
            const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

            if (isNaN(submissionTime) || now - submissionTime > MAX_AGE_MS || submissionTime > now + 60000) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Request expired. Please try again.',
                    },
                    { status: 400 }
                );
            }
        }

        // 7. Validate project description
        if (!projectDescription || typeof projectDescription !== 'string') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Project description is required.',
                },
                { status: 400 }
            );
        }

        // Check minimum text length (anti-bot measure)
        const trimmedDescription = projectDescription.trim();
        if (trimmedDescription.length < MIN_TEXT_LENGTH) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Project description must be at least ${MIN_TEXT_LENGTH} characters long.`,
                },
                { status: 400 }
            );
        }

        // Check maximum text length
        if (trimmedDescription.length > MAX_TEXT_LENGTH) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Project description must not exceed ${MAX_TEXT_LENGTH} characters.`,
                },
                { status: 400 }
            );
        }

        // Honeypot detection: Check for suspicious patterns
        const suspiciousPatterns = [
            /<script/i,
            /<iframe/i,
            /javascript:/i,
            /data:text\/html/i,
            /on\w+\s*=/i, // onclick=, onload=, etc.
        ];

        for (const pattern of suspiciousPatterns) {
            if (pattern.test(trimmedDescription)) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Invalid content detected in project description.',
                    },
                    { status: 400 }
                );
            }
        }

        // Validate file if provided
        let fileInfo = null;
        if (file && file.size > 0) {
            // Check file type
            const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
            const isValidExtension = ALLOWED_EXTENSIONS.includes(fileExtension);
            const isValidMimeType = ALLOWED_FILE_TYPES.includes(file.type);

            if (!isValidExtension && !isValidMimeType) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.',
                    },
                    { status: 400 }
                );
            }

            // Check file size (max 10MB)
            const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'File size exceeds maximum limit of 10MB.',
                    },
                    { status: 400 }
                );
            }

            fileInfo = {
                name: file.name,
                type: file.type,
                size: file.size,
            };
        }

        // Simulate processing delay (remove in production)
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Generate a mock specification response
        // In production, this would call an AI service or processing pipeline
        const mockSpecification = {
            id: `spec_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            projectName: extractProjectName(trimmedDescription),
            summary: generateMockSummary(trimmedDescription),
            requirements: generateMockRequirements(trimmedDescription),
            generatedAt: new Date().toISOString(),
            inputMetadata: {
                descriptionLength: trimmedDescription.length,
                hasAttachment: !!fileInfo,
                attachmentInfo: fileInfo,
            },
        };

        return NextResponse.json(
            {
                success: true,
                message: 'Specification generated successfully.',
                data: mockSpecification,
            },
            {
                status: 200,
                headers: {
                    'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
                    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                },
            }
        );
    } catch (error) {
        console.error('Error processing generate request:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'An unexpected error occurred. Please try again.',
            },
            { status: 500 }
        );
    }
}

// Helper functions for mock data generation
function extractProjectName(description: string): string {
    // Extract first sentence or first 50 characters as project name
    const firstSentence = description.split(/[.!?]/)[0];
    if (firstSentence.length <= 50) {
        return firstSentence.trim();
    }
    return firstSentence.substring(0, 50).trim() + '...';
}

function generateMockSummary(description: string): string {
    return `This specification document outlines the requirements and technical details for: "${description.substring(0, 100)}${description.length > 100 ? '...' : ''}"`;
}

function generateMockRequirements(description: string): Array<{
    id: string;
    category: string;
    title: string;
    description: string;
    priority: string;
}> {
    // Generate mock requirements based on description keywords
    const requirements = [
        {
            id: 'REQ-001',
            category: 'Functional',
            title: 'Core Feature Implementation',
            description: 'Implement the main functionality as described in the project brief.',
            priority: 'High',
        },
        {
            id: 'REQ-002',
            category: 'Non-Functional',
            title: 'Performance Requirements',
            description: 'System should respond within 2 seconds for standard operations.',
            priority: 'Medium',
        },
        {
            id: 'REQ-003',
            category: 'Security',
            title: 'Data Protection',
            description: 'Implement proper data encryption and access controls.',
            priority: 'High',
        },
    ];

    // Add contextual requirement based on description
    if (description.toLowerCase().includes('api') || description.toLowerCase().includes('backend')) {
        requirements.push({
            id: 'REQ-004',
            category: 'Technical',
            title: 'API Development',
            description: 'Design and implement RESTful API endpoints.',
            priority: 'High',
        });
    }

    if (description.toLowerCase().includes('user') || description.toLowerCase().includes('interface')) {
        requirements.push({
            id: 'REQ-005',
            category: 'UX/UI',
            title: 'User Interface Design',
            description: 'Create intuitive and responsive user interface.',
            priority: 'High',
        });
    }

    return requirements;
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': ALLOWED_ORIGINS.join(', '),
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id, X-CSRF-Token',
            'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
        },
    });
}

// GET endpoint to retrieve CSRF token for forms
export async function GET(request: NextRequest) {
    try {
        // Rate limiting for token generation
        const rateLimitKey = getRateLimitKey(request);
        const rateLimit = checkRateLimit(rateLimitKey);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { success: false, error: 'Rate limit exceeded.' },
                { status: 429 }
            );
        }

        // Generate new CSRF token
        const sessionId = request.headers.get('x-session-id') || rateLimitKey;
        const token = generateSecureToken();

        // Store token with expiration
        csrfTokenStore.set(sessionId, {
            token,
            expiresAt: Date.now() + CSRF_TOKEN_EXPIRY_MS,
        });

        // Clean up expired tokens periodically
        if (Math.random() < 0.1) { // 10% chance to clean up
            const now = Date.now();
            for (const [key, value] of csrfTokenStore.entries()) {
                if (now > value.expiresAt) {
                    csrfTokenStore.delete(key);
                }
            }
        }

        return NextResponse.json(
            {
                success: true,
                csrfToken: token,
                expiresIn: CSRF_TOKEN_EXPIRY_MS / 1000,
            },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate',
                    'X-Session-Id': sessionId,
                },
            }
        );
    } catch (error) {
        console.error('Error generating CSRF token:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate security token.' },
            { status: 500 }
        );
    }
}