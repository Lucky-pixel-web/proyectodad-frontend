import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { parseAuthError } from '../../utils/auth-error.util';
import {
  LoginRole,
  clearLockout,
  formatCountdown,
  getLockoutMessage,
  getLockoutUntil,
  isAttemptsWarningMessage,
  isLockoutMessage,
  parseLockoutSeconds,
  setLockout,
} from '../../utils/auth-lockout.util';

const ADMIN_ICONS = ['👔', '🛡️', '⚙️', '📋', '🔑'];
const USER_ICONS = ['📦', '🏭', '🔧', '🚚', '📋'];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  errorMessage = '';
  lockoutDetailMessage = '';
  successMessage = '';
  cargando = false;
  modo: LoginRole = 'admin';
  lockoutRemaining = 0;
  lockMins = '00';
  lockSecs = '00';

  readonly adminIcons = ADMIN_ICONS;
  readonly userIcons = USER_ICONS;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private timerId: ReturnType<typeof setInterval> | null = null;
  private credentials: Record<LoginRole, { username: string; password: string }> = {
    admin: { username: '', password: '' },
    user: { username: '', password: '' },
  };

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
      return;
    }
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
    this.syncLockoutState();
    this.startLockoutTimer();
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
  }

  get isLocked(): boolean {
    return this.lockoutRemaining > 0;
  }

  get floatIcons(): string[] {
    return this.modo === 'admin' ? this.adminIcons : this.userIcons;
  }

  setModo(m: LoginRole): void {
    if (this.isLocked || m === this.modo) return;
    this.credentials[this.modo] = { ...this.loginForm.value };
    this.modo = m;
    this.loginForm.patchValue(this.credentials[m]);
    this.errorMessage = '';
    this.successMessage = '';
    this.syncLockoutState();
  }

  onLogin(): void {
    if (this.isLocked || this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.cargando = true;
    this.errorMessage = '';
    this.successMessage = '';
    const creds = this.loginForm.value;
    this.credentials[this.modo] = { ...creds };

    const obs = this.modo === 'admin'
      ? this.authService.loginAdmin(creds)
      : this.authService.loginUser(creds);

    obs.subscribe({
      next: (res) => {
        this.cargando = false;
        clearLockout(this.modo);
        localStorage.setItem('username_display', res.username);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.cargando = false;
        const msg = parseAuthError(err, 'Credenciales inválidas. Verifica tu usuario o contraseña.');

        if (isAttemptsWarningMessage(msg)) {
          clearLockout(this.modo);
          this.errorMessage = msg;
          this.lockoutDetailMessage = '';
          this.syncLockoutState();
          return;
        }

        const seconds = parseLockoutSeconds(msg);
        if (seconds && isLockoutMessage(msg)) {
          setLockout(this.modo, seconds, msg);
          this.lockoutDetailMessage = msg;
          this.errorMessage = '';
          this.syncLockoutState();
          return;
        }

        this.errorMessage = msg;
        this.lockoutDetailMessage = '';
      },
    });
  }

  private startLockoutTimer(): void {
    this.timerId = setInterval(() => this.syncLockoutState(), 1000);
  }

  private syncLockoutState(): void {
    const until = getLockoutUntil(this.modo);
    const prev = this.lockoutRemaining;

    if (!until) {
      if (prev > 0) {
        this.successMessage =
          'Su cuenta ha sido desbloqueada. Ya puede iniciar sesión. Recuerde: si vuelve a fallar los intentos, será bloqueada nuevamente.';
        this.errorMessage = '';
        this.lockoutDetailMessage = '';
      }
      this.lockoutRemaining = 0;
      this.lockMins = '00';
      this.lockSecs = '00';
      this.loginForm.enable();
      return;
    }

    const remaining = Math.ceil((until - Date.now()) / 1000);
    this.lockoutRemaining = remaining;
    const { mins, secs } = formatCountdown(remaining);
    this.lockMins = mins;
    this.lockSecs = secs;
    this.lockoutDetailMessage = getLockoutMessage(this.modo) || this.lockoutDetailMessage;
    this.loginForm.disable();
    this.successMessage = '';
  }
}
