/**
 * Security utilities for Discrepômetro Frontend
 * Provides input validation, sanitization, and security checks
 */

// Input validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  FILENAME: /^[a-zA-Z0-9._-]+$/,
  URL: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  SAFE_STRING: /^[a-zA-Z0-9\s\-_.,()]+$/
};

// File type validation
export const ALLOWED_FILE_TYPES = {
  EXCEL: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.ms-excel.sheet.macroEnabled.12'
  ],
  PDF: ['application/pdf'],
  CSV: ['text/csv', 'application/csv']
};

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  EXCEL: 50 * 1024 * 1024, // 50MB
  PDF: 100 * 1024 * 1024,  // 100MB
  CSV: 10 * 1024 * 1024    // 10MB
};

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  // Check file size
  const maxSize = FILE_SIZE_LIMITS.EXCEL; // Default to Excel limit
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `Arquivo muito grande. Tamanho máximo: ${Math.round(maxSize / 1024 / 1024)}MB` 
    };
  }

  // Check file type
  const isValidType = Object.values(ALLOWED_FILE_TYPES).flat().includes(file.type);
  if (!isValidType) {
    return { 
      valid: false, 
      error: 'Tipo de arquivo não suportado. Use Excel, PDF ou CSV.' 
    };
  }

  // Check filename
  if (!VALIDATION_PATTERNS.FILENAME.test(file.name)) {
    return { 
      valid: false, 
      error: 'Nome do arquivo contém caracteres inválidos.' 
    };
  }

  return { valid: true };
}

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (attempt.count >= this.maxAttempts) {
      return false;
    }

    attempt.count++;
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * CSRF token generation and validation
 */
export class CSRFProtection {
  private static tokens = new Set<string>();

  static generateToken(): string {
    const token = crypto.randomUUID();
    this.tokens.add(token);
    return token;
  }

  static validateToken(token: string): boolean {
    const isValid = this.tokens.has(token);
    if (isValid) {
      this.tokens.delete(token); // Use once
    }
    return isValid;
  }

  static cleanup(): void {
    this.tokens.clear();
  }
}

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
};

/**
 * Content Security Policy
 */
export const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self' https://hvjjcegcdivumprqviug.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ');
