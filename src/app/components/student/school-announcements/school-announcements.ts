import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { Api } from '../../../api/api';
import { showstudent } from '../../../api/functions';
import { enviroments } from '../../../enviroments/envitoments';
import { PaginatorModule } from 'primeng/paginator';

@Component({
  selector: 'app-school-announcements',
  imports: [CommonModule, CardModule, ButtonModule, ToastModule, PaginatorModule],
  providers: [MessageService],
  standalone: true,
  templateUrl: './school-announcements.html',
  styleUrl: './school-announcements.css'
})
export class SchoolAnnouncementsComponent implements OnInit {
  student: any = null;
  school: any = null;
  announcementsList: any[] = [];
  loading: boolean = true;

  // Variables para la paginación
  first: number = 0;
  rows: number = 6;
  totalRecords: number = 0;
  paginatedAnnouncements: any[] = [];

  private authService = inject(AuthService);
  private api = inject(Api);
  private http = inject(HttpClient);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    setTimeout(async () => {
      if (this.authService.isLoggedIn()) {
        try {
          const currentUser = this.authService.getCurrentUser();
          const userId = currentUser ? currentUser.idUser : '';
          
          if (userId) {
            this.loadStudentAndAnnouncements(userId);
          } else {
            this.loading = false;
            this.cdr.detectChanges();
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      } else {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadStudentAndAnnouncements(userId: string): void {
    this.api.invoke(showstudent, { idStudent: userId }).then((response: any) => {
      const parseResponse = typeof response === 'string' ? JSON.parse(response) : response;
      this.student = parseResponse.data ? parseResponse.data : parseResponse;
      
      if (this.student && this.student.parentSchool) {
        this.school = this.student.parentSchool;
        if (this.school.urlImageSchool) {
          let path = this.school.urlImageSchool.replace(/\\/g, '/');
          if (path.startsWith('http://') || path.startsWith('https://')) {
            this.school.urlImageSchool = path;
          } else {
            if (path.startsWith('/')) path = path.substring(1);
            let baseUrl = enviroments.URL_NORMAL.endsWith('/') ? enviroments.URL_NORMAL : `${enviroments.URL_NORMAL}/`;
            this.school.urlImageSchool = baseUrl + encodeURI(path);
          }
        }
        this.cdr.detectChanges();
        this.loadSchoolFiles(this.school.idSchool);
      } else {
        this.announcementsList = [];
        this.totalRecords = 0;
        this.paginatedAnnouncements = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    }).catch((err) => {
      console.error('Error loading student details:', err);
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  loadSchoolFiles(idSchool: string): void {
    this.http.get(`${this.api.rootUrl}/indexschoolfile/${idSchool}`).subscribe({
      next: (files: any) => {
        if (Array.isArray(files)) {
          files.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        this.announcementsList = files || [];
        this.totalRecords = this.announcementsList.length;
        this.first = 0;
        this.updatePaginatedAnnouncements();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading school files:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los comunicados de su escuela.',
          life: 2000
        });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onPageChange(event: any): void {
    this.first = event.first;
    this.rows = event.rows;
    this.updatePaginatedAnnouncements();
    this.cdr.detectChanges();
  }

  updatePaginatedAnnouncements(): void {
    this.paginatedAnnouncements = this.announcementsList.slice(this.first, this.first + this.rows);
  }

  getCleanFileName(name: string): string {
    if (name && name.includes('_')) {
      return name.substring(name.indexOf('_') + 1);
    }
    return name;
  }

  getFileIcon(extension: string): string {
    const ext = extension ? extension.toLowerCase() : '';
    if (ext === 'pdf') {
      return 'pi pi-file-pdf text-red-500 text-3xl';
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return 'pi pi-image text-green-500 text-3xl';
    } else if (['doc', 'docx'].includes(ext)) {
      return 'pi pi-file-word text-blue-500 text-3xl';
    }
    return 'pi pi-file text-gray-500 text-3xl';
  }

  previewAnnouncement(file: any): void {
    if (!this.school) return;
    const baseUrl = enviroments.URL_NORMAL.endsWith('/') ? enviroments.URL_NORMAL : `${enviroments.URL_NORMAL}/`;
    const fileUrl = `${baseUrl}storage/schoolFile/${encodeURIComponent(this.school.nameSchool)}/${encodeURIComponent(file.name)}`;
    window.open(fileUrl, '_blank');
  }
}
