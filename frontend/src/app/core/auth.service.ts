import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, firstValueFrom, throwError } from 'rxjs';

const KEY = 'clinic.studio.session';

interface Session {
  token: string;
  email: string;
  demo: boolean;
}

function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private session = signal<Session | null>(readSession());

  readonly isSignedIn = computed(() => this.session() !== null);
  readonly email = computed(() => this.session()?.email ?? '');
  readonly isDemo = computed(() => this.session()?.demo ?? false);
  token(): string | null {
    return this.session()?.token ?? null;
  }

  async signIn(email: string, password: string): Promise<void> {
    const s = await firstValueFrom(this.http.post<Session>('/api/auth/login', { email, password }));
    try {
      sessionStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* storage blocked: session lasts for this tab only */
    }
    this.session.set(s);
  }

  signOut(redirect = true): void {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    this.session.set(null);
    if (redirect) this.router.navigateByUrl('/studio/sign-in');
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const authed = token && req.url.startsWith('/api/') ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(authed).pipe(
    catchError((err: HttpErrorResponse) => {
      // Our own 401s (session expired) send the admin back to sign in.
      // Meta 401s also come back as 401 but carry a metaCode, so don't log out for those.
      if (err.status === 401 && token && !err.error?.metaCode) auth.signOut();
      return throwError(() => err);
    }),
  );
};

export const studioGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isSignedIn() ? true : inject(Router).parseUrl('/studio/sign-in');
};

export function errorMessage(err: unknown, fallback = 'Something went wrong. Try again.'): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Can’t reach the server. Check that the API is running and you are online.';
    const body = err.error as { error?: string; fields?: { path: string; message: string }[] } | null;
    if (body?.fields?.length) return `${body.error ?? 'Check these fields'} ${body.fields.map((f) => `${f.path}: ${f.message}`).join('; ')}`;
    if (body?.error) return body.error;
  }
  return fallback;
}
