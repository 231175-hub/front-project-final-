import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Form Fields
  loginEmail: string = '';
  loginPassword: String = '';
  loginError: string = '';
  isLoginLoading: boolean = false;

  showPassword: boolean = false;
  rightPanelActive: boolean = false;

  // Forgot password fields
  resetEmail: string = '';
  resetMessage: string = '';
  resetMessageType: 'success' | 'error' | '' = '';
  isResetLoading: boolean = false;

  constructor() {
    // If user is already logged in, redirect immediately to dispatcher or dashboard
    if (this.authService.isLoggedIn()) {
      this.redirectUserByRole();
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  openSignUpPanel(): void {
    this.rightPanelActive = true;
    this.loginError = '';
  }

  openSignInPanel(): void {
    this.rightPanelActive = false;
    this.resetMessage = '';
  }

  onLogin(): void {
    if (!this.loginEmail || !this.loginPassword) {
      this.loginError = 'Por favor ingrese su correo y contraseña.';
      return;
    }

    this.isLoginLoading = true;
    this.loginError = '';

    this.authService.login(this.loginEmail, String(this.loginPassword)).subscribe({
      next: (res) => {
        this.isLoginLoading = false;
        if (res.success) {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'];
          if (returnUrl) {
            this.router.navigateByUrl(returnUrl);
          } else {
            this.redirectUserByRole();
          }
        } else {
          this.loginError = res.message || 'Credenciales incorrectas.';
        }
      },
      error: (err) => {
        this.isLoginLoading = false;
        console.error('Error al iniciar sesión:', err);
        if (err.error && err.error.message) {
          this.loginError = err.error.message;
        } else if (err.status === 401) {
          this.loginError = 'Correo o contraseña incorrectos.';
        } else {
          this.loginError = 'Error de conexión con el servidor. Intente más tarde.';
        }
      }
    });
  }

  onResetPassword(): void {
    if (!this.resetEmail) {
      this.resetMessage = 'Por favor ingrese su dirección de correo.';
      this.resetMessageType = 'error';
      return;
    }

    this.isResetLoading = true;
    this.resetMessage = '';

    this.authService.forgotPassword(this.resetEmail).subscribe({
      next: (res) => {
        this.isResetLoading = false;
        this.resetMessage = res.message || 'Instrucciones enviadas a su correo si está registrado.';
        this.resetMessageType = 'success';
      },
      error: (err) => {
        this.isResetLoading = false;
        console.error('Error al solicitar restablecimiento:', err);
        this.resetMessage = 'Se enviaron las instrucciones si el correo existe.';
        this.resetMessageType = 'success';
      }
    });
  }

  private redirectUserByRole(): void {
    const roles = this.authService.getUserRoles();
    if (roles.includes('ADMIN')) {
      this.router.navigate(['/admin/dashboard']);
    } else if (roles.includes('PROFESSOR')) {
      this.router.navigate(['/professor/dashboard']);
    } else if (roles.includes('STUDENT')) {
      this.router.navigate(['/student/dashboard']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
