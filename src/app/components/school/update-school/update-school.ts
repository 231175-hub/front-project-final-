import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { showschool, updateschool } from '../../../api/functions';
import { Api } from '../../../api/api';

import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { confirmAction } from '../../../core/utils/confirm.helper';
import { ButtonModule } from 'primeng/button';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';

import { BadgeModule } from 'primeng/badge';;
import { ProgressBarModule } from 'primeng/progressbar';
import { PrimeNG } from 'primeng/config';
import { ActivatedRoute } from '@angular/router';
import { enviroments } from '../../../enviroments/envitoments';
@Component({
  selector: 'app-update-school',
  imports: [CommonModule, InputTextModule, FormsModule, ReactiveFormsModule, ButtonModule, ConfirmDialogModule, ToastModule, FileUploadModule, BadgeModule, ProgressBarModule],
  templateUrl: './update-school.html',
  styleUrl: './update-school.css',
  standalone: true,
  providers: [ConfirmationService, MessageService]
})
export class UpdateSchool implements OnInit{
  @ViewChild('imageUpload') fileUploadComponent!: FileUpload;

  public school: any = [];
  public env = enviroments;

  idOfPage: string | null = null;
  frmUpdateSchool: FormGroup; 

  get nameSchoolfb() {return this.frmUpdateSchool.controls['nameSchool']};
  get filefb() {return this.frmUpdateSchool.controls['imageSchool']};

  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private config = inject(PrimeNG);

  constructor(private formBuilder: FormBuilder, private api: Api, private router: ActivatedRoute){
    this.frmUpdateSchool = formBuilder.group({
      'nameSchool': ['', [Validators.required]],
      'imageSchool': [null],
    });
  }

  ngOnInit(): void {
    this.idOfPage = this.router.snapshot.paramMap.get('idSchool')
    this.api.invoke(showschool, { idSchool: this.idOfPage! }).then((response: any) =>{
      const parseResponse = typeof response === 'string' ? JSON.parse(response) : response;
      this.school = parseResponse.data ? parseResponse.data : parseResponse;

      const setValue = {
        nameSchool: this.school.nameSchool,
        imageSchool: null,
      }

      this.frmUpdateSchool.patchValue(setValue);
    }).catch((error) => {
      this.messageService.add({ severity: 'error', summary: 'Exception', detail: 'Ups. Algo salio mal' + error});
    });
  }

  sendUpdateSchool(event: Event){
    if (!this.frmUpdateSchool.valid) {
      this.frmUpdateSchool.markAllAsTouched();
      this.frmUpdateSchool.markAllAsDirty();

      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Complete los datos fatantes. Por favor.' });
      return
    }

    confirmAction(this.confirmationService, event, '¿Desea ingresar esta escuela?', () => {
      const bodyParams = {
        'idSchool': this.idOfPage!,
        body: {
          nameSchool: this.nameSchoolfb.value,
          file: this.filefb.value,
        }
      };

      this.api.invoke(updateschool, bodyParams).then((response: any) => {
        const updateSchool = typeof response === 'string' ? JSON.parse(response) : response;
        this.frmUpdateSchool.reset();
        
        this.frmUpdateSchool.get('imageSchool')?.setValue(null);
        if (this.fileUploadComponent) {
          this.fileUploadComponent.clear();
        }
      }).catch((error) => {
        this.messageService.add({ severity: 'error', summary: 'Exception', detail: 'Ups. Algo salio mal' + error});
      });
    });
  }

  
  files: File[] = [];
  totalSize: number = 0;
  totalSizePercent: number = 0;

  choose(event: Event, callback: Function) {
    callback();
  }

  onClearTemplatingUpload(clear: Function) {
    clear();
    this.totalSize = 0;
    this.totalSizePercent = 0;
  }

  onTemplatedUpload() {
    this.messageService.add({ severity: 'info', summary: 'Success', detail: 'File Uploaded', life: 3000 });
  }

  onSelectedFiles(event:any) {
    this.files = event.currentFiles;
    this.files.forEach((file) => {
      this.totalSize += parseInt(this.formatSize(file.size));
    });
    this.totalSizePercent = this.totalSize / 10;

    this.frmUpdateSchool.patchValue({ imageSchool: this.files[0] });
  }

  uploadEvent(callback: Function) {
    callback();
  }

  formatSize(bytes: number) {
    const k = 1024;
    const dm = 3;
    const sizes = this.config.translation.fileSizeTypes;
    if (bytes === 0) {
        return `0 ${sizes![0]}`;
    }
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const formattedSize = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
    
    return `${formattedSize} ${sizes![i]}`;
  }
}
