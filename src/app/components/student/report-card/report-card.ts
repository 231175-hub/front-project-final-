import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../core/services/auth.service';
import { Api } from '../../../api/api';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ChartModule } from 'primeng/chart';
import { reportcardstudent } from '../../../api/functions'; 

@Component({
  selector: 'app-report-card',
  standalone: true,
  imports: [CommonModule, ButtonModule, ToastModule, ChartModule],
  templateUrl: './report-card.html',
  styleUrl: './report-card.css',
  providers: [MessageService]
})
export class ReportCard implements OnInit {
  public reportCards = signal<any[]>([]);
  public loading = signal<boolean>(true);
  public errorMessage = signal<string | null>(null);

  public isDownloadingCertificate = signal<boolean>(false);
  public isDownloadingAcademicHistory = signal<boolean>(false);

  public chartData = signal<any>(null);
  public chartOptions = signal<any>(null);

  private authService = inject(AuthService);
  private api = inject(Api);
  private messageService = inject(MessageService);
  private http = inject(HttpClient);

  constructor() {}

  async ngOnInit() {
    if (this.authService.isLoggedIn()) {
      try {
        const user = this.authService.getCurrentUser();
        const idStudent = user ? user.idUser : '';

        if (idStudent) {
          this.loadReportCards(idStudent);
        }
      } catch (err) {
        console.error('Error getting user profile', err);
        this.loading.set(false);
      }
    }
  }

  loadReportCards(idStudentKeycloak: string): void {
    this.api.invoke(reportcardstudent, { idStudentKeycloak: idStudentKeycloak }).then((response: any) => {
      let apiResponseTemp = typeof response === 'string' ? JSON.parse(response) : response;
      
      if (apiResponseTemp.success) {
        let apiResponse = apiResponseTemp.data ? apiResponseTemp.data : apiResponseTemp;
        
        const mapped = apiResponse.map((boleta: any) => {
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

        this.reportCards.set(mapped);
      } else {
        this.errorMessage.set(apiResponseTemp.message || apiResponseTemp.error);
      }

      this.loading.set(false);
    }).catch((error) => {
      console.error("Error connecting to report card API:", error);
      this.errorMessage.set("Error de conexión con el servidor.");
      this.loading.set(false);
    });
  }

  previewCertificate(): void {
    this.isDownloadingCertificate.set(true);
    this.messageService.add({ 
      severity: 'info', 
      summary: 'Generando', 
      detail: 'Preparando tu Constancia de Matrícula, un momento por favor...' 
    });

    const endpoint = this.api.rootUrl.endsWith('/intranet') 
      ? `${this.api.rootUrl}/downloadscorepdf` 
      : `${this.api.rootUrl}/intranet/downloadscorepdf`;

    this.http.get(endpoint, {
      responseType: 'blob'
    }).subscribe({
      next: (pdfBlob: Blob) => {
        const fileUrl = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
        window.open(fileUrl, '_blank');
        this.messageService.add({ 
          severity: 'success', 
          summary: '¡Listo!', 
          detail: 'Constancia de Matrícula generada con éxito.' 
        });
        setTimeout(() => window.URL.revokeObjectURL(fileUrl), 1000);
        this.isDownloadingCertificate.set(false);
      },
      error: (err) => {
        console.error('Error downloading certificate:', err);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Hubo un error al generar la Constancia de Matrícula.' 
        });
        this.isDownloadingCertificate.set(false);
      }
    });
  }

  previewHistory(): void {
    this.isDownloadingAcademicHistory.set(true);
    this.messageService.add({ 
      severity: 'info', 
      summary: 'Generando', 
      detail: 'Preparando tu Historial Académico, un momento por favor...' 
    });

    const endpoint = this.api.rootUrl.endsWith('/intranet') 
      ? `${this.api.rootUrl}/downloadrecordpdf` 
      : `${this.api.rootUrl}/intranet/downloadrecordpdf`;

    this.http.get(endpoint, {
      responseType: 'blob'
    }).subscribe({
      next: (pdfBlob: Blob) => {
        const fileUrl = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
        window.open(fileUrl, '_blank');
        this.messageService.add({ 
          severity: 'success', 
          summary: '¡Listo!', 
          detail: 'Historial Académico generado con éxito.' 
        });
        setTimeout(() => window.URL.revokeObjectURL(fileUrl), 1000);
        this.isDownloadingAcademicHistory.set(false);
      },
      error: (err) => {
        console.error('Error downloading academic history:', err);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Hubo un error al generar el Historial Académico.' 
        });
        this.isDownloadingAcademicHistory.set(false);
      }
    });
  }
}