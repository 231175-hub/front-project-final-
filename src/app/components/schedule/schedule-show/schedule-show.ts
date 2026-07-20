import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Api } from '../../../api/api';
import { indexschedule } from '../../../api/functions'; 
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

export interface ScheduleDTO {
  dayWeek: string;
  startTime: string;
  endTime: string;
  classroom: string;
  courseName: string;
  groupName: string; 
}

export interface ScheduleCellDTO {
  lessons: ScheduleDTO[];
  duration: number;
}

@Component({
  selector: 'app-schedule-show',
  imports: [ CommonModule, ButtonModule, ToastModule ],
  providers: [ MessageService ],
  templateUrl: './schedule-show.html',
  styleUrl: './schedule-show.css',
})
export class ScheduleShow implements OnInit {
  daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  dayLabels: { [key: string]: string } = {
    'Monday': 'Lunes',
    'Tuesday': 'Martes',
    'Wednesday': 'Miércoles',
    'Thursday': 'Jueves',
    'Friday': 'Viernes'
  };
  hours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  
  customSchedule: { [key: string]: ScheduleCellDTO } = {};
  skipCells: { [key: string]: boolean } = {};
  placedLessons: any[] = [];
  
  isDownloadingPdf: boolean = false; 

  constructor(
    private api: Api, 
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private messageService: MessageService
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
    this.skipCells = {};
    this.placedLessons = [];
 
    const dayMap: { [key: string]: string } = {
      'Lunes': 'Monday',
      'Martes': 'Tuesday',
      'Miércoles': 'Wednesday',
      'Miercoles': 'Wednesday',
      'Jueves': 'Thursday',
      'Viernes': 'Friday'
    };
 
    const activeHourly: { [key: string]: ScheduleDTO[] } = {};
    backendData.forEach(lesson => {
      const startHour = parseInt(lesson.startTime.split(':')[0], 10);
      const endHour = parseInt(lesson.endTime.split(':')[0], 10);
      const englishDay = dayMap[lesson.dayWeek] || lesson.dayWeek;

      for (let h = startHour; h < endHour; h++) {
        const key = `${englishDay}-${h}`;
        if (!activeHourly[key]) {
          activeHourly[key] = [];
        }
        activeHourly[key].push(lesson);
      }
    });

    backendData.forEach(lesson => {
      const startHour = parseInt(lesson.startTime.split(':')[0], 10);
      const endHour = parseInt(lesson.endTime.split(':')[0], 10);
      const englishDay = dayMap[lesson.dayWeek] || lesson.dayWeek;

      let hasConflict = false;
      for (let h = startHour; h < endHour; h++) {
        const key = `${englishDay}-${h}`;
        if (activeHourly[key] && activeHourly[key].length > 1) {
          hasConflict = true;
          break;
        }
      }

      if (!hasConflict) {
        const cellKey = `${englishDay}-${startHour}`;
        this.customSchedule[cellKey] = {
          lessons: [lesson],
          duration: endHour - startHour
        };
        for (let h = startHour + 1; h < endHour; h++) {
          this.skipCells[`${englishDay}-${h}`] = true;
        }
      } else {
        for (let h = startHour; h < endHour; h++) {
          const cellKey = `${englishDay}-${h}`;
          if (!this.customSchedule[cellKey]) {
            this.customSchedule[cellKey] = {
              lessons: activeHourly[cellKey] || [],
              duration: 1
            };
          }
        }
      }
    });

    const lessonsMap = new Map<string, ScheduleDTO[]>();
    backendData.forEach(lesson => {
      const englishDay = dayMap[lesson.dayWeek] || lesson.dayWeek;
      const startHour = parseInt(lesson.startTime.split(':')[0], 10);
      const endHour = parseInt(lesson.endTime.split(':')[0], 10);
      const key = `${englishDay}-${startHour}-${endHour}`;
      if (!lessonsMap.has(key)) {
        lessonsMap.set(key, []);
      }
      const list = lessonsMap.get(key)!;
      if (!list.some(l => l.courseName === lesson.courseName && l.groupName === lesson.groupName)) {
        list.push(lesson);
      }
    });

    const dayCols: { [key: string]: number } = {
      'Monday': 2,
      'Tuesday': 3,
      'Wednesday': 4,
      'Thursday': 5,
      'Friday': 6
    };

    lessonsMap.forEach((lessons, key) => {
      const parts = key.split('-');
      const day = parts[0];
      const startHour = parseInt(parts[1], 10);
      const endHour = parseInt(parts[2], 10);

      const col = dayCols[day] || 2;
      const startRow = startHour - 7 + 2;
      const endRow = endHour - 7 + 2;

      this.placedLessons.push({
        key,
        lessons,
        gridRow: `${startRow} / ${endRow}`,
        gridColumn: `${col}`
      });
    });
  }

  getHourGridRow(hour: number): string {
    const row = hour - 7 + 2;
    return `${row}`;
  }

  getDayGridCol(day: string): string {
    const dayCols: { [key: string]: number } = {
      'Monday': 2,
      'Tuesday': 3,
      'Wednesday': 4,
      'Thursday': 5,
      'Friday': 6
    };
    return `${dayCols[day] || 2}`;
  }

  async previewSchedulePdf(): Promise<void> {
    this.isDownloadingPdf = true;
    this.cdr.detectChanges();
    this.messageService.add({ 
      severity: 'info', 
      summary: 'Generando', 
      detail: 'Preparando tu Horario, un momento por favor...' 
    });

    try {
      const token = this.authService.getToken();

      const response = await fetch(`${this.api.rootUrl}/downloadschedulepdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('El servidor falló al generar el horario');
      }

      const pdfBlob = await response.blob();
      const fileUrl = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
      
      window.open(fileUrl, '_blank');
      
      this.messageService.add({ 
        severity: 'success', 
        summary: '¡Listo!', 
        detail: 'Horario generado con éxito.' 
      });

      setTimeout(() => window.URL.revokeObjectURL(fileUrl), 1000);

    } catch (error) {
      console.error('Error opening schedule PDF:', error);
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Hubo un error al generar el Horario.' 
      });
    } finally {
      this.isDownloadingPdf = false;
      this.cdr.detectChanges();
    }
  }
}