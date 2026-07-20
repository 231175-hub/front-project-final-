import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { me } from '../../../api/fn/me/me'; 
import { ApiConfiguration } from '../../../api/api-configuration';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-root-dispatcher-component',
  imports: [],
  templateUrl: './root-dispatcher-component.html',
  styleUrl: './root-dispatcher-component.css',
  standalone: true,
})
export class RootDispatcherComponent implements OnInit {
  
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiConfig = inject(ApiConfiguration);
  private authService = inject(AuthService);

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    const urlDinamica = this.apiConfig.rootUrl;

    me(this.http, urlDinamica).subscribe({
      next: (respuesta) => {
        const localProfile = respuesta.body;
        
        if (!localProfile) {
          this.authService.logout();
          return;
        }

        const roleDataBase = localProfile.role ? localProfile.role.toLowerCase() : '';

        if (roleDataBase === 'admin' || roleDataBase === 'administrator') {
          this.router.navigate(['/admin/dashboard']);
        } else if (roleDataBase === 'professor' || roleDataBase === 'profesor') {
          this.router.navigate(['/professor/dashboard']);
        } else if (roleDataBase === 'student' || roleDataBase === 'estudiante') {
          this.router.navigate(['/student/dashboard']);
        } else {
          console.warn('Rol desconocido o nulo:', roleDataBase);
          this.router.navigate(['/login']);
        }
      },
      error: (err) => {
        console.error('Error HTTP al llamar a /me:', err);
        this.authService.logout();
      }
    });
  }
}