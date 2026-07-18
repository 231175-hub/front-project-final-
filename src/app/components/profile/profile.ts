import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { KeycloakService } from 'keycloak-angular';
import { HttpClient } from '@angular/common/http';

import { me, uploadimg, Uploadimg$Params } from '../../api/functions';
import { Api } from '../../api/api';
import { ApiConfiguration } from '../../api/api-configuration';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ButtonModule, ToastModule],
  providers: [MessageService], 
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  private apiConfig = inject(ApiConfiguration);
  public usernameLogueado: string = 'Cargando...';
  public email: string = '';
  public role: string = '';
  public profilePicUrl: string = '/default-avatar.png'; // Por defecto
  
  public selectedFile: File | null = null;
  public isUploading: boolean = false;

  private http = inject(HttpClient);
  private keycloakService = inject(KeycloakService);
  private cdr = inject(ChangeDetectorRef);
  private messageService = inject(MessageService);

  constructor(private api: Api) {}

  ngOnInit() {
    this.loadMyProfile();
  }

  private async loadMyProfile() {
    const urlDinamica = this.apiConfig.rootUrl;

    try {
      const profile = await this.keycloakService.loadUserProfile();
      this.email = profile.email || '';
      
      const roles = this.keycloakService.getUserRoles();
      const userRoles = roles.filter(r => ['ADMIN', 'PROFESSOR', 'STUDENT'].includes(r));
      this.role = userRoles.length > 0 ? userRoles[0] : (roles[0] || 'Usuario');
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Error al cargar datos del perfil desde Keycloak:', err);
    }

    me(this.http, urlDinamica).subscribe({
        next: (respuesta) => {
            const profileData: any = respuesta.body;
            
            if (profileData) {
                this.usernameLogueado = profileData.full_name || 'Usuario';
                this.cdr.detectChanges();

                if (profileData.url_image) {
                    const timestamp = new Date().getTime();
                    let imageUrl = `${urlDinamica}${profileData.url_image}`;
                    if (imageUrl.includes('/intranet/intranet/')) {
                        imageUrl = imageUrl.replace('/intranet/intranet/', '/intranet/');
                    }
                    imageUrl = `${imageUrl}?t=${timestamp}`;
                    this.downloadProfileImage(imageUrl);
                } else {
                    this.cdr.detectChanges();
                }
            }
        },
        error: async (err) => {
            console.error('Error al llamar a /me en el perfil:', err);
            const profile = await this.keycloakService.loadUserProfile();
            this.usernameLogueado = profile.firstName || 'Usuario';
            this.cdr.detectChanges();
        }
    });
  }

  private async downloadProfileImage(imageUrl: string) {
    try {
      await this.keycloakService.updateToken(20);
      const token = await this.keycloakService.getToken();
      const response = await fetch(imageUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        
        if (this.profilePicUrl && this.profilePicUrl.startsWith('blob:')) {
          URL.revokeObjectURL(this.profilePicUrl);
        }
        
        this.profilePicUrl = URL.createObjectURL(blob);
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Error al descargar la imagen de perfil:', error);
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePicUrl = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  uploadProfilePicture() {
    if (!this.selectedFile) return;

    this.isUploading = true;

    const bodyParams: Uploadimg$Params = {
      body: {
        file: this.selectedFile 
      }
    };

    this.api.invoke(uploadimg, bodyParams).then((response: any) => {
      this.messageService.add({ 
        severity: 'success', 
        summary: '¡Éxito!', 
        detail: 'Foto de perfil actualizada correctamente' 
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);

    }).catch((error) => {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Exception', 
        detail: 'Ups. Algo salió mal: ' + error 
      });
    }).finally(() => {
      this.isUploading = false;
      this.cdr.detectChanges();
    });
  }
}