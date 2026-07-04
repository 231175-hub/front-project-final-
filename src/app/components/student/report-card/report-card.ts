import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { KeycloakService } from 'keycloak-angular';
import { Api } from '../../../api/api';

import { reportcardstudent, exportscorepdf, exportrecordpdf } from '../../../api/functions'; 

@Component({
  selector: 'app-report-card',
  imports: [CommonModule, ButtonModule],
  standalone: true,
  templateUrl: './report-card.html',
  styleUrl: './report-card.css',
})
export class ReportCard implements OnInit {
  public boletas: any[] = [];
  
  public loading: boolean = true;
  public errorMensaje: string | null = null;

  public isDownloadingConstancia: boolean = false;
  public isDownloadingHistorial: boolean = false;

  constructor(
    private keycloakService: KeycloakService,
    private api: Api,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    if (await this.keycloakService.isLoggedIn()) {
      try {
        const userProfile = await this.keycloakService.loadUserProfile();
        const idStudentKeycloak = userProfile.id || '';

        if (idStudentKeycloak) {
          this.loadReportCards(idStudentKeycloak);
        }
      } catch (err) {
        console.error('Error al obtener perfil de Keycloak', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    }
  }

  loadReportCards(idStudentKeycloak: string): void {
    this.api.invoke(reportcardstudent, { idStudentKeycloak: idStudentKeycloak }).then((response: any) => {
      let apiResponseTemp = typeof response === 'string' ? JSON.parse(response) : response;
      
      if (apiResponseTemp.success) {
        let apiResponse = apiResponseTemp.data ? apiResponseTemp.data : apiResponseTemp;
        
        this.boletas = apiResponse.map((boleta: any) => {
          const unidades = [];
          
          for (let i = 1; i <= 5; i++) {
            if (boleta.notas && boleta.notas[`CC${i}`] !== undefined) {
              unidades.push({
                numero: i,
                conceptual: boleta.notas[`CC${i}`] || '-',
                procedimental: boleta.notas[`CP${i}`] || '-',
                actitudinal: boleta.notas[`CA${i}`] || '-',
                promedio: boleta.notas[`PF${i}`] || '-'
              });
            }
          }
          
          boleta.unidadesProcesadas = unidades;
          boleta.promedioGeneral = boleta.notas ? (boleta.notas['PPF'] || '-') : '-';
          
          return boleta;
        });

      } else {
        this.errorMensaje = apiResponseTemp.message || apiResponseTemp.error;
      }

      this.loading = false;
      this.cdr.detectChanges(); 

    }).catch((error) => {
      console.error("Error al conectar con la API de notas:", error);
      this.errorMensaje = "Error de conexión con el servidor.";
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  async previewCertificate(): Promise<void> {
    this.isDownloadingConstancia = true;
    this.cdr.detectChanges();

    try {
      const token = await this.keycloakService.getToken();

      const response = await fetch('http://localhost:8081/intranet/downloadscorepdf', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('El servidor falló al generar la constancia');
      }

      const pdfBlob = await response.blob();
      const fileUrl = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
      
      window.open(fileUrl, '_blank');
      
      setTimeout(() => window.URL.revokeObjectURL(fileUrl), 1000);

    } catch (error) {
      console.error('Error maestro abriendo la constancia:', error);
      alert('Hubo un error al generar la Constancia de Matrícula.');
    } finally {
      this.isDownloadingConstancia = false;
      this.cdr.detectChanges();
    }
  }

  async previewHistory(): Promise<void> {
    this.isDownloadingHistorial = true;
    this.cdr.detectChanges();

    try {
      const token = await this.keycloakService.getToken();
      
      const response = await fetch('http://localhost:8081/intranet/downloadrecordpdf', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('El servidor falló al generar el historial');
      }

      const pdfBlob = await response.blob();
      const fileUrl = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
      
      window.open(fileUrl, '_blank');
      
      setTimeout(() => window.URL.revokeObjectURL(fileUrl), 1000);

    } catch (error) {
      console.error('Error maestro abriendo el historial:', error);
      alert('Hubo un error al generar el Historial Académico.');
    } finally {
      this.isDownloadingHistorial = false;
      this.cdr.detectChanges();
    }
  }
}