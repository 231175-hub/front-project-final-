import { ChangeDetectorRef, Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../api/api';
import { AuthService } from '../../../core/services/auth.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-group-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  templateUrl: './group-register.html',
  styleUrl: './group-register.css',
})
export class GroupRegisterComponent implements OnInit, OnDestroy {
  idGroup: string = '';
  groupInfo: any = null;
  units: any[] = [];
  classDates: string[] = [];
  weeks: any[] = [];
  students: any[] = [];

  ccCounts: number[] = [];
  cpCounts: number[] = [];
  tCounts: number[] = [];

  currentTab: 'notas' | 'asistencias' = 'notas';
  loading: boolean = true;
  saving: boolean = false;
  closing: boolean = false;

  showSaveConfirmModal: boolean = false;
  showSaveSuccessModal: boolean = false;
  showCloseConfirmModal: boolean = false;
  showCloseSuccessModal: boolean = false;
  showDeleteUnitConfirmModal: boolean = false;
  unitToDeleteId: string = '';
  unitToDeleteNumber: number = 0;

  showWeightsModal: boolean = false;
  weightConceptual: number = 40;
  weightPractical: number = 40;
  weightAttitudinal: number = 20;

  autoSaveSubject: Subject<void> = new Subject<void>();
  autoSaveSub?: Subscription;
  autoSaveStatus: 'saved' | 'saving' | 'dirty' | 'offline-saved' = 'saved';

  activeEditors: string[] = [];
  private sseSource?: EventSource;
  private heartbeatInterval?: any;
  public currentUserFullName: string = '';

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.autoSaveStatus === 'dirty' || this.autoSaveStatus === 'saving' || this.autoSaveStatus === 'offline-saved') {
      $event.returnValue = true;
    }
  }

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private api: Api,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.idGroup = params['idGroup'] || '';
      if (this.idGroup) {
        this.loadData();
        this.setupAutoSave();
        this.setupConcurrency();
        window.addEventListener('online', this.onConnectionRestored.bind(this));
      }
    });
  }

  ngOnDestroy(): void {
    if (this.autoSaveSub) {
      this.autoSaveSub.unsubscribe();
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.sseSource) {
      this.sseSource.close();
    }
    window.removeEventListener('online', this.onConnectionRestored.bind(this));
    if (this.currentUserFullName && this.idGroup) {
      this.http.post(`${this.api.rootUrl}/concurrency/disconnect/${this.idGroup}/${encodeURIComponent(this.currentUserFullName)}`, {}).subscribe();
    }
  }

  setupAutoSave(): void {
    this.autoSaveSub = this.autoSaveSubject.pipe(
      debounceTime(2000)
    ).subscribe(() => {
      this.triggerSilentSave();
    });
  }

  async setupConcurrency() {
    try {
      if (this.authService.isLoggedIn()) {
        const profile = this.authService.getCurrentUser();
        this.currentUserFullName = profile ? profile.fullName : 'Docente Anónimo';
        if (!this.currentUserFullName.trim()) {
          this.currentUserFullName = 'Docente Anónimo';
        }
        const sseUrl = `${this.api.rootUrl}/concurrency/active-session/${this.idGroup}/${encodeURIComponent(this.currentUserFullName)}`;
        this.sseSource = new EventSource(sseUrl);
        this.sseSource.addEventListener('editors', (event: any) => {
          this.activeEditors = JSON.parse(event.data);
          this.cdr.markForCheck();
        });
        this.heartbeatInterval = setInterval(() => {
          this.http.post(`${this.api.rootUrl}/concurrency/heartbeat/${this.idGroup}/${encodeURIComponent(this.currentUserFullName)}`, {}).subscribe();
        }, 3000);
      }
    } catch (e) {
      console.error('Error setting up concurrency tracking:', e);
    }
  }

  loadData(): void {
    this.loading = true;
    this.http.get(`${this.api.rootUrl}/group-register/${this.idGroup}`).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.groupInfo = res.groupInfo;
          this.units = res.units;
          this.classDates = res.classDates || [];
          this.weeks = res.weeks || [];
          this.students = res.students;

          this.students.forEach(student => {
            student.unitScores.forEach((uScore: any) => {
              uScore.conceptualGradesList = this.parseGradesString(
                uScore.conceptualGrades || (uScore.conceptualScore !== null ? uScore.conceptualScore.toString() : '')
              );
              uScore.practicalGradesList = this.parseGradesString(
                uScore.practicalGrades || (uScore.practicalScore !== null ? uScore.practicalScore.toString() : '')
              );
              let rawTests = uScore.testGrades;
              if (!rawTests) {
                const list = [];
                if (uScore.test1Score !== null) list.push(uScore.test1Score);
                if (uScore.test2Score !== null) list.push(uScore.test2Score);
                rawTests = list.join(',');
              }
              uScore.testGradesList = this.parseGradesString(rawTests);
            });
          });

          this.calculateColumnCounts();
          this.applyOfflineCacheIfExists();
        } else {
          alert('Error al cargar datos: ' + res.listMessage.join('\n'));
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching sheet data', err);
        alert('Error al conectar con el servidor.');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  parseGradesString(str: string): any[] {
    if (!str || str.trim() === '') return [null];
    return str.split(',').map(s => {
      const clean = s.trim().toUpperCase();
      if (clean === 'NSP' || clean === '-1') return -1;
      if (clean === '') return null;
      const num = Number(clean);
      return isNaN(num) ? null : num;
    });
  }

  calculateColumnCounts(): void {
    this.ccCounts = this.units.map(() => 1);
    this.cpCounts = this.units.map(() => 1);
    this.tCounts = this.units.map(() => 2);

    this.students.forEach(student => {
      student.unitScores.forEach((uScore: any, uIdx: number) => {
        if (uScore.conceptualGradesList && uScore.conceptualGradesList.length > this.ccCounts[uIdx]) {
          this.ccCounts[uIdx] = uScore.conceptualGradesList.length;
        }
        if (uScore.practicalGradesList && uScore.practicalGradesList.length > this.cpCounts[uIdx]) {
          this.cpCounts[uIdx] = uScore.practicalGradesList.length;
        }
        if (uScore.testGradesList && uScore.testGradesList.length > this.tCounts[uIdx]) {
          this.tCounts[uIdx] = uScore.testGradesList.length;
        }
      });
    });

    this.students.forEach(student => {
      student.unitScores.forEach((uScore: any, uIdx: number) => {
        while (uScore.conceptualGradesList.length < this.ccCounts[uIdx]) {
          uScore.conceptualGradesList.push(null);
        }
        while (uScore.practicalGradesList.length < this.cpCounts[uIdx]) {
          uScore.practicalGradesList.push(null);
        }
        while (uScore.testGradesList.length < this.tCounts[uIdx]) {
          uScore.testGradesList.push(null);
        }
      });
    });
  }

  addCcColumn(unitIndex: number): void {
    if (this.groupInfo?.closed) return;
    this.ccCounts[unitIndex]++;
    this.students.forEach(student => {
      student.unitScores[unitIndex].conceptualGradesList.push(null);
    });
    this.cdr.markForCheck();
    this.markDirty();
  }

  addCpColumn(unitIndex: number): void {
    if (this.groupInfo?.closed) return;
    this.cpCounts[unitIndex]++;
    this.students.forEach(student => {
      student.unitScores[unitIndex].practicalGradesList.push(null);
    });
    this.cdr.markForCheck();
    this.markDirty();
  }

  addTColumn(unitIndex: number): void {
    if (this.groupInfo?.closed) return;
    this.tCounts[unitIndex]++;
    this.students.forEach(student => {
      student.unitScores[unitIndex].testGradesList.push(null);
    });
    this.cdr.markForCheck();
    this.markDirty();
  }

  addNewUnit(): void {
    if (this.groupInfo?.closed) return;
    const nextNumber = this.units.length + 1;
    this.http.post(`${this.api.rootUrl}/registerunits`, {
      numberUnit: nextNumber,
      nameUnit: 'Unidad ' + nextNumber,
      idGroup: this.idGroup
    }).subscribe({
      next: (res: any) => {
        this.loadData();
      },
      error: (err) => {
        console.error('Error adding unit', err);
        alert('Error al agregar unidad: ' + (err.error?.error || err.message));
      }
    });
  }

  deleteUnit(idUnits: string, uIdx: number): void {
    if (this.groupInfo?.closed) return;
    this.unitToDeleteId = idUnits;
    this.unitToDeleteNumber = this.units[uIdx].numberUnit;
    this.showDeleteUnitConfirmModal = true;
  }

  cancelDeleteUnit(): void {
    this.showDeleteUnitConfirmModal = false;
    this.unitToDeleteId = '';
    this.unitToDeleteNumber = 0;
  }

  confirmDeleteUnit(): void {
    this.showDeleteUnitConfirmModal = false;
    this.http.delete(`${this.api.rootUrl}/deleteunits/${this.unitToDeleteId}`).subscribe({
      next: (res: any) => {
        this.unitToDeleteId = '';
        this.unitToDeleteNumber = 0;
        this.loadData();
      },
      error: (err) => {
        console.error('Error deleting unit', err);
        alert('Error al eliminar unidad: ' + (err.error?.error || err.message));
      }
    });
  }

  removeCcColumn(unitIndex: number): void {
    if (this.groupInfo?.closed) return;
    if (this.ccCounts[unitIndex] <= 1) return;
    this.ccCounts[unitIndex]--;
    this.students.forEach(student => {
      student.unitScores[unitIndex].conceptualGradesList.pop();
    });
    this.cdr.markForCheck();
    this.markDirty();
  }

  removeCpColumn(unitIndex: number): void {
    if (this.groupInfo?.closed) return;
    if (this.cpCounts[unitIndex] <= 1) return;
    this.cpCounts[unitIndex]--;
    this.students.forEach(student => {
      student.unitScores[unitIndex].practicalGradesList.pop();
    });
    this.cdr.markForCheck();
    this.markDirty();
  }

  removeTColumn(unitIndex: number): void {
    if (this.groupInfo?.closed) return;
    if (this.tCounts[unitIndex] <= 1) return;
    this.tCounts[unitIndex]--;
    this.students.forEach(student => {
      student.unitScores[unitIndex].testGradesList.pop();
    });
    this.cdr.markForCheck();
    this.markDirty();
  }

  getRange(count: number): number[] {
    return Array(count).fill(0).map((_, i) => i);
  }

  displayGrade(val: any): string {
    if (val === null || val === undefined || val === '') return '';
    if (val === -1 || val === 'NSP') return 'NSP';
    return val.toString();
  }

  parseGrade(val: any): number {
    if (val === null || val === undefined || val === '' || val === -1 || val === 'NSP') return 0;
    const num = Number(val);
    if (isNaN(num) || num < 0) return 0;
    return num;
  }

  calculateAverageOfGrades(gradesList: any[]): number {
    let sum = 0;
    gradesList.forEach(g => {
      if (g !== null && g !== undefined && g !== '') {
        const val = (g === -1) ? 0.0 : Number(g);
        sum += val;
      }
    });
    return Number((sum / gradesList.length).toFixed(2));
  }

  onCcGradeInput(event: any, student: any, gradeIndex: number, unitIndex: number): void {
    const val = event.target.value.trim().toUpperCase();
    const uScore = student.unitScores[unitIndex];

    if (val === '') {
      uScore.conceptualGradesList[gradeIndex] = null;
    } else if (val === 'NSP') {
      uScore.conceptualGradesList[gradeIndex] = -1;
    } else {
      const num = Number(val);
      if (!isNaN(num) && num >= 0 && num <= 20) {
        uScore.conceptualGradesList[gradeIndex] = num;
      } else {
        event.target.value = this.displayGrade(uScore.conceptualGradesList[gradeIndex]);
      }
    }

    uScore.conceptualScore = this.calculateAverageOfGrades(uScore.conceptualGradesList);
    this.calculateUnitPf(student, unitIndex);
    this.cdr.markForCheck();
    this.markDirty();
  }

  onCpGradeInput(event: any, student: any, gradeIndex: number, unitIndex: number): void {
    const val = event.target.value.trim().toUpperCase();
    const uScore = student.unitScores[unitIndex];

    if (val === '') {
      uScore.practicalGradesList[gradeIndex] = null;
    } else if (val === 'NSP') {
      uScore.practicalGradesList[gradeIndex] = -1;
    } else {
      const num = Number(val);
      if (!isNaN(num) && num >= 0 && num <= 20) {
        uScore.practicalGradesList[gradeIndex] = num;
      } else {
        event.target.value = this.displayGrade(uScore.practicalGradesList[gradeIndex]);
      }
    }

    uScore.practicalScore = this.calculateAverageOfGrades(uScore.practicalGradesList);
    this.calculateUnitPf(student, unitIndex);
    this.cdr.markForCheck();
    this.markDirty();
  }

  onTGradeInput(event: any, student: any, gradeIndex: number, unitIndex: number): void {
    const val = event.target.value.trim().toUpperCase();
    const uScore = student.unitScores[unitIndex];

    if (val === '') {
      uScore.testGradesList[gradeIndex] = null;
    } else if (val === 'NSP') {
      uScore.testGradesList[gradeIndex] = -1;
    } else {
      const num = Number(val);
      if (!isNaN(num) && num >= 0 && num <= 20) {
        uScore.testGradesList[gradeIndex] = num;
      } else {
        event.target.value = this.displayGrade(uScore.testGradesList[gradeIndex]);
      }
    }

    uScore.attitudinalScore = this.calculateAverageOfGrades(uScore.testGradesList);
    this.calculateUnitPf(student, unitIndex);
    this.cdr.markForCheck();
    this.markDirty();
  }

  onInputKeyDown(event: KeyboardEvent): void {
    const key = event.key;
    if (key !== 'ArrowUp' && key !== 'ArrowDown' && key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'Enter') {
      return;
    }

    const target = event.target as HTMLInputElement;
    const cell = target.closest('td');
    if (!cell) return;

    const row = cell.closest('tr');
    if (!row) return;

    const tbody = row.closest('tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));
    const rowIndex = rows.indexOf(row);

    const cellsInRow = Array.from(row.querySelectorAll('td.cell-editable'));
    const cellIndex = cellsInRow.indexOf(cell);

    if (key === 'ArrowUp') {
      if (rowIndex > 0) {
        const prevRow = rows[rowIndex - 1];
        const targetCell = prevRow.querySelectorAll('td.cell-editable')[cellIndex];
        const input = targetCell?.querySelector('input');
        input?.focus();
        input?.select();
        event.preventDefault();
      }
    } else if (key === 'ArrowDown' || key === 'Enter') {
      if (rowIndex < rows.length - 1) {
        const nextRow = rows[rowIndex + 1];
        const targetCell = nextRow.querySelectorAll('td.cell-editable')[cellIndex];
        const input = targetCell?.querySelector('input');
        input?.focus();
        input?.select();
        event.preventDefault();
      }
    } else if (key === 'ArrowLeft') {
      if (cellIndex > 0) {
        const targetCell = cellsInRow[cellIndex - 1];
        const input = targetCell?.querySelector('input');
        input?.focus();
        input?.select();
        event.preventDefault();
      }
    } else if (key === 'ArrowRight') {
      if (cellIndex < cellsInRow.length - 1) {
        const targetCell = cellsInRow[cellIndex + 1];
        const input = targetCell?.querySelector('input');
        input?.focus();
        input?.select();
        event.preventDefault();
      }
    }
  }

  calculateUnitPf(student: any, unitIndex: number): number {
    const scores = student.unitScores[unitIndex];

    const cc = this.parseGrade(scores.conceptualScore);
    const cp = this.parseGrade(scores.practicalScore);
    const ca = this.parseGrade(scores.attitudinalScore);

    const pf = cc * this.groupInfo.conceptualWeight +
               cp * this.groupInfo.practicalWeight +
               ca * this.groupInfo.attitudinalWeight;

    scores.score = Number(pf.toFixed(2));
    return scores.score;
  }

  calculatePpf(student: any): string | number {
    let sumOfUnits = 0;
    for (let i = 0; i < this.units.length; i++) {
      sumOfUnits += this.calculateUnitPf(student, i);
    }
    const rawPpf = sumOfUnits / this.units.length;
    if (rawPpf === 0) {
      return 'NSP';
    }
    return Math.round(rawPpf);
  }

  getStudentState(student: any): string {
    const ppfVal = this.calculatePpf(student);
    if (ppfVal === 'NSP') {
      return 'NSP';
    }

    const ppf = Number(ppfVal);
    if (ppf >= 10.5) {
      return 'Aprobado';
    }

    let sumCp = 0;
    let sumCa = 0;
    student.unitScores.forEach((u: any) => {
      sumCp += this.parseGrade(u.practicalScore);
      sumCa += this.parseGrade(u.attitudinalScore);
    });

    const avgCp = sumCp / this.units.length;
    const avgCa = sumCa / this.units.length;

    if (avgCp < 8 || avgCa < 8) {
      return 'Desaprobado';
    }

    return 'Sustitutorio';
  }

  getAttendanceCount(student: any, status: string): number {
    if (!student.attendances) return 0;
    return student.attendances.filter((a: any) => a.status === status).length;
  }

  saveChanges(): void {
    if (this.groupInfo?.closed) {
      alert('Este registro ya está cerrado y no se puede modificar.');
      return;
    }
    this.showSaveConfirmModal = true;
    this.cdr.markForCheck();
  }

  confirmSave(): void {
    this.showSaveConfirmModal = false;
    this.saving = true;
    this.cdr.markForCheck();

    const payload = this.buildPayload();

    this.http.post(`${this.api.rootUrl}/group-register/${this.idGroup}`, payload).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.showSaveSuccessModal = true;
        this.autoSaveStatus = 'saved';
        localStorage.removeItem('group_register_offline_cache_' + this.idGroup);
        this.loadData();
      },
      error: (err) => {
        console.error('Error saving data', err);
        alert('Error al guardar datos: ' + (err.error?.error || err.message));
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  closeRegister(): void {
    this.showCloseConfirmModal = true;
    this.cdr.markForCheck();
  }

  confirmCloseRegister(): void {
    this.showCloseConfirmModal = false;
    this.closing = true;
    this.cdr.markForCheck();

    this.http.post(`${this.api.rootUrl}/group-register/${this.idGroup}/close`, {}).subscribe({
      next: (res: any) => {
        this.closing = false;
        this.showCloseSuccessModal = true;
        this.loadData();
      },
      error: (err) => {
        console.error('Error closing register', err);
        alert('No se pudo cerrar el acta:\n\n' + (err.error?.error || err.message));
        this.closing = false;
        this.cdr.markForCheck();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/professor/dashboard/groupProfessor']);
  }

  getColumnAttendanceCount(dateStr: string, status: string): number {
    let count = 0;
    if (this.students) {
      for (let student of this.students) {
        if (student.attendances) {
          let att = student.attendances.find((a: any) => a.date === dateStr);
          if (att && att.status === status) {
            count++;
          }
        }
      }
    }
    return count;
  }

  markDirty(): void {
    if (this.groupInfo?.closed) return;
    this.autoSaveStatus = 'dirty';
    this.autoSaveSubject.next();
    this.cdr.markForCheck();
  }

  triggerSilentSave(): void {
    if (this.groupInfo?.closed) return;
    this.autoSaveStatus = 'saving';
    this.cdr.markForCheck();

    const payload = this.buildPayload();

    this.http.post(`${this.api.rootUrl}/group-register/${this.idGroup}`, payload).subscribe({
      next: (res: any) => {
        this.autoSaveStatus = 'saved';
        localStorage.removeItem('group_register_offline_cache_' + this.idGroup);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error auto-saving:', err);
        if (!navigator.onLine || err.status === 0) {
          localStorage.setItem('group_register_offline_cache_' + this.idGroup, JSON.stringify(payload));
          this.autoSaveStatus = 'offline-saved';
        } else {
          this.autoSaveStatus = 'dirty';
        }
        this.cdr.markForCheck();
      }
    });
  }

  onConnectionRestored(): void {
    const cached = localStorage.getItem('group_register_offline_cache_' + this.idGroup);
    if (cached) {
      this.autoSaveStatus = 'saving';
      this.cdr.markForCheck();
      const payload = JSON.parse(cached);
      this.http.post(`${this.api.rootUrl}/group-register/${this.idGroup}`, payload).subscribe({
        next: () => {
          this.autoSaveStatus = 'saved';
          localStorage.removeItem('group_register_offline_cache_' + this.idGroup);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error syncing offline cache:', err);
          this.autoSaveStatus = 'offline-saved';
          this.cdr.markForCheck();
        }
      });
    }
  }

  applyOfflineCacheIfExists(): void {
    const cachedStr = localStorage.getItem('group_register_offline_cache_' + this.idGroup);
    if (!cachedStr) return;
    try {
      const cached = JSON.parse(cachedStr);
      const cachedStudents = cached.students || [];

      cachedStudents.forEach((cs: any) => {
        const student = this.students.find(s => s.idGroupStudent === cs.idGroupStudent);
        if (student) {
          cs.unitScores.forEach((cus: any) => {
            const uScore = student.unitScores.find((u: any) => u.idUnits === cus.idUnits);
            if (uScore) {
              uScore.conceptualScore = cus.conceptualScore;
              uScore.practicalScore = cus.practicalScore;
              uScore.test1Score = cus.test1Score;
              uScore.test2Score = cus.test2Score;
              uScore.attitudinalScore = cus.attitudinalScore;
              uScore.score = cus.score;

              uScore.conceptualGradesList = cus.conceptualGrades ? cus.conceptualGrades.split(',').map((g: any) => g === '' ? null : (g === '-1' ? -1 : Number(g))) : [];
              uScore.practicalGradesList = cus.practicalGrades ? cus.practicalGrades.split(',').map((g: any) => g === '' ? null : (g === '-1' ? -1 : Number(g))) : [];
              uScore.testGradesList = cus.testGrades ? cus.testGrades.split(',').map((g: any) => g === '' ? null : (g === '-1' ? -1 : Number(g))) : [];
            }
          });

          cs.attendances.forEach((catt: any) => {
            const att = student.attendances.find((a: any) => a.idAttendance === catt.idAttendance || a.date === catt.date);
            if (att) {
              att.status = catt.status;
            }
          });
        }
      });

      this.autoSaveStatus = 'offline-saved';
      this.cdr.markForCheck();

      alert('Aviso: Se restauraron cambios locales guardados anteriormente sin conexión en este dispositivo.');
    } catch (e) {
      console.error('Error applying offline cache:', e);
    }
  }

  private buildPayload(): any {
    return {
      students: this.students.map((s) => ({
        idGroupStudent: s.idGroupStudent,
        unitScores: s.unitScores.map((u: any) => ({
          idUnitScore: u.idUnitScore,
          idUnits: u.idUnits,
          conceptualScore: u.conceptualScore === null ? 0.0 : u.conceptualScore,
          practicalScore: u.practicalScore === null ? 0.0 : u.practicalScore,
          test1Score: u.test1Score === null ? 0.0 : u.test1Score,
          test2Score: u.test2Score === null ? 0.0 : u.test2Score,
          attitudinalScore: u.attitudinalScore === null ? 0.0 : u.attitudinalScore,
          conceptualGrades: u.conceptualGradesList.map((g: any) => g === null ? '' : g).join(','),
          practicalGrades: u.practicalGradesList.map((g: any) => g === null ? '' : g).join(','),
          testGrades: u.testGradesList.map((g: any) => g === null ? '' : g).join(','),
          score: u.score,
        })),
        attendances: s.attendances
          .filter((a: any) => a.status && a.status.trim() !== '')
          .map((a: any) => ({
            idAttendance: a.idAttendance,
            date: a.date,
            status: a.status,
          })),
      })),
    };
  }

  openWeightsDialog(): void {
    if (this.groupInfo) {
      this.weightConceptual = Math.round((this.groupInfo.conceptualWeight || 0.4) * 100);
      this.weightPractical = Math.round((this.groupInfo.practicalWeight || 0.4) * 100);
      this.weightAttitudinal = Math.round((this.groupInfo.attitudinalWeight || 0.2) * 100);
      this.showWeightsModal = true;
    }
  }

  saveWeights(): void {
    if (this.weightConceptual + this.weightPractical + this.weightAttitudinal !== 100) {
      return;
    }

    const payload = {
      conceptualWeight: this.weightConceptual / 100,
      practicalWeight: this.weightPractical / 100,
      attitudinalWeight: this.weightAttitudinal / 100
    };

    this.http.put(`${this.api.rootUrl}/updategroupweights/${this.idGroup}`, payload).subscribe({
      next: (res: any) => {
        this.showWeightsModal = false;
        this.loadData();
      },
      error: (err: any) => {
        console.error('Error saving weights:', err);
      }
    });
  }
}
