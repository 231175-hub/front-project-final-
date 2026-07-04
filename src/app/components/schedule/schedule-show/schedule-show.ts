import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Api } from '../../../api/api';
import { indexschedule } from '../../../api/functions'; 
import { CommonModule } from '@angular/common';
// IMPORTANTE: Agregamos KeycloakService
import { KeycloakService } from 'keycloak-angular';

export interface ScheduleDTO {
  dayWeek: string;
  startTime: string;
  endTime: string;
  classroom: string;
  courseName: string;
  groupName: string; 
  duration?: number; 
  skip?: boolean;
}

@Component({
  selector: 'app-schedule-show',
  imports: [ CommonModule ],
  templateUrl: './schedule-show.html',
  styleUrl: './schedule-show.css',
})
export class ScheduleShow implements OnInit {
  daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  hours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  
  customSchedule: { [key: string]: ScheduleDTO } = {};
  
  // Variable para controlar el estado del botón
  isDownloadingPdf: boolean = false; 

  constructor(
    private api: Api, 
    private cdr: ChangeDetectorRef,
    private keycloakService: KeycloakService // <-- INYECTADO AQUÍ
  ) {}

  ngOnInit(): void {
    this.loadSchedule();
  }

  loadSchedule() {
    this.api.invoke(indexschedule).then((res: any) => {
      let apiResponse = typeof res === 'string' ? JSON.parse(res) : res;
      let scheduleData = apiResponse.data ? apiResponse.data : apiResponse;
      
      this.processSchedule(scheduleData);
      this.cdr.markForCheck();
      
    }).catch((err: any) => {
      console.error('Error invoking indexschedule:', err);
    });
  }

  processSchedule(backendData: ScheduleDTO[]) {
    this.customSchedule = {}; 

    const dayMap: { [key: string]: string } = {
      'Lunes': 'Monday',
      'Martes': 'Tuesday',
      'Miércoles': 'Wednesday',
      'Miercoles': 'Wednesday',
      'Jueves': 'Thursday',
      'Viernes': 'Friday'
    };

    backendData.forEach(lesson => {
      const startHour = parseInt(lesson.startTime.split(':')[0], 10);
      const endHour = parseInt(lesson.endTime.split(':')[0], 10);
      const englishDay = dayMap[lesson.dayWeek] || lesson.dayWeek;
      
      const duration = endHour - startHour;

      this.customSchedule[`${englishDay}-${startHour}`] = {
        ...lesson,
        duration: duration
      };

      for (let h = startHour + 1; h < endHour; h++) {
        this.customSchedule[`${englishDay}-${h}`] = { skip: true } as ScheduleDTO;
      }
    });
  }

  // --- NUEVO MÉTODO DE PREVISUALIZACIÓN ---
  async previewSchedulePdf(): Promise<void> {
    this.isDownloadingPdf = true;
    this.cdr.detectChanges();

    try {
      const token = await this.keycloakService.getToken();

      const response = await fetch('http://localhost:8081/intranet/downloadschedulepdf', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('El servidor falló al generar el horario');
      }

      // Procesamos la respuesta como un blob binario puro (Esto arregla la hoja en blanco)
      const pdfBlob = await response.blob();
      const fileUrl = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
      
      // Abrimos en una nueva pestaña
      window.open(fileUrl, '_blank');
      
      setTimeout(() => window.URL.revokeObjectURL(fileUrl), 1000);

    } catch (error) {
      console.error('Error abriendo el horario en PDF:', error);
      alert('Hubo un error al generar el Horario.');
    } finally {
      this.isDownloadingPdf = false;
      this.cdr.detectChanges();
    }
  }
}