import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { ButtonModule } from 'primeng/button';
import { KeycloakService } from 'keycloak-angular'; 
import { Api } from '../../../api/api';

import { closeevent, getprofessorgroups, googlesheets, Googlesheets$Params } from '../../../api/functions';

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
    private keycloakService: KeycloakService
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

  // --- BOTÓN 1: ABRIR EXCEL ---
  openAcademicRegister(idGroupValue: string): void {
    this.loadingStates[idGroupValue] = true;

    const bodyParams: Googlesheets$Params = {
      body: {
        idGroup: idGroupValue
      }
    };

    this.api.invoke(googlesheets, bodyParams).then((response: any) => {
      let apiResponse = typeof response === 'string' ? JSON.parse(response) : response;
      this.loadingStates[idGroupValue] = false;
      this.cdr.markForCheck();

      if (apiResponse.url) {
        const ancho = 1200;
        const alto = 750;
        const izquierda = (window.screen.width / 2) - (ancho / 2);
        const arriba = (window.screen.height / 2) - (alto / 2);

        window.open(
          apiResponse.url, 
          'RegistroAcademicoPopup', 
          `width=${ancho},height=${alto},top=${arriba},left=${izquierda},resizable=yes,scrollbars=yes,status=no,location=no,toolbar=no,menubar=no`
        );
      } else {
        const errorMsg = apiResponse.listMessage ? apiResponse.listMessage[0] : 'Error al generar';
        alert('Ocurrió un error: ' + errorMsg);
      }
    }).catch(error => {
      this.loadingStates[idGroupValue] = false;
      this.cdr.markForCheck();
      console.error("Error al conectar con el servidor", error);
      alert("Error de conexión. Revisa el backend.");
    });
  }

  closeAcademicRegister(idGroupValue: string): void {
    const confirmacion = window.confirm("¿Estás seguro de que deseas cerrar el acta? Se validarán las notas en el Excel y se guardarán de forma permanente. Esta acción no se puede deshacer.");
    if (!confirmacion) return;

    this.closingStates[idGroupValue] = true;
    this.cdr.markForCheck();

    this.api.invoke(closeevent, { idGroup: idGroupValue }).then((response: any) => {
      let apiResponse = typeof response === 'string' ? JSON.parse(response) : response;
      
      this.closingStates[idGroupValue] = false;
      this.cdr.markForCheck();

      if (apiResponse.success) {
        alert("¡Éxito! " + apiResponse.message);
      }
    }).catch(error => {
      this.closingStates[idGroupValue] = false;
      this.cdr.markForCheck();
      
      let errorMsg = "No se pudo conectar con el servidor.";
      
      if (error && error.error && error.error.error) {
          errorMsg = error.error.error; // Aquí viene el "Faltan notas para el alumno..."
      } else if (error && error.message) {
          errorMsg = error.message;
      }
      
      alert("⚠️ No se pudo cerrar el acta:\n\n" + errorMsg);
    });
  }
}