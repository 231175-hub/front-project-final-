import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { ButtonModule } from 'primeng/button';
import { KeycloakService } from 'keycloak-angular'; 
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Api } from '../../../api/api';

import { getprofessorgroups } from '../../../api/functions';

@Component({
  selector: 'app-groups-professor',
  imports: [ButtonModule, CommonModule], 
  templateUrl: './groups-professor.html',
  styleUrl: './groups-professor.css',
})
export class GroupsProfessor implements OnInit {
  assignedGroups: any[] = [];
  
  // Estados de carga independientes
  loadingStates: { [key: string]: boolean } = {}; 
  closingStates: { [key: string]: boolean } = {}; // <-- NUEVO: Para el botón de cerrar acta

  idProfesorReal: string = '';

  constructor(
    private api: Api, 
    private cdr: ChangeDetectorRef, 
    private keycloakService: KeycloakService,
    private router: Router,
    private http: HttpClient
  ) {}

  async ngOnInit(): Promise<void> {
    if (await this.keycloakService.isLoggedIn()) {
      try {
        const userProfile = await this.keycloakService.loadUserProfile();
        this.idProfesorReal = userProfile.id || '';
        
        if (this.idProfesorReal) {
          this.loadGroups(this.idProfesorReal);
        }
      } catch (error) {
        console.error("Error al obtener el perfil de Keycloak", error);
      }
    }
  }

  loadGroups(idProfessor: string): void {
    this.api.invoke(getprofessorgroups, { idProfessor: idProfessor }).then((res: any) => {
      let apiResponse = typeof res === 'string' ? JSON.parse(res) : res;
      this.assignedGroups = apiResponse.data ? apiResponse.data : apiResponse;
      this.cdr.markForCheck();
    });
  }

  // --- BOTÓN 1: ABRIR REGISTRO LOCAL ---
  openAcademicRegister(idGroupValue: string): void {
    this.router.navigate(['/professor/dashboard/group-register', idGroupValue]);
  }

  // --- BOTÓN 2: CERRAR ACTA LOCAL ---
  closeAcademicRegister(idGroupValue: string): void {
    const confirmacion = window.confirm("¿Estás seguro de que deseas cerrar el acta? Se validarán las notas locales y se guardarán de forma permanente en el historial académico. Esta acción no se puede deshacer.");
    if (!confirmacion) return;

    this.closingStates[idGroupValue] = true;
    this.cdr.markForCheck();

    this.http.post(`${this.api.rootUrl}/group-register/${idGroupValue}/close`, {}).subscribe({
      next: (response: any) => {
        this.closingStates[idGroupValue] = false;
        this.cdr.markForCheck();
        if (response.success) {
          alert("¡Éxito! " + response.message);
        }
      },
      error: (error) => {
        this.closingStates[idGroupValue] = false;
        this.cdr.markForCheck();
        let errorMsg = "No se pudo conectar con el servidor.";
        if (error && error.error && error.error.error) {
            errorMsg = error.error.error;
        } else if (error && error.message) {
            errorMsg = error.message;
        }
        alert("⚠️ No se pudo cerrar el acta:\n\n" + errorMsg);
      }
    });
  }
}