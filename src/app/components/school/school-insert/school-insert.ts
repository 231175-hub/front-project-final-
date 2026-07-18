import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { Registerschool$Params, registerschool } from '../../../api/functions';
import { Api } from '../../../api/api';

import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { confirmAction } from '../../../core/utils/confirm.helper';
import { ButtonModule } from 'primeng/button';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';

import { BadgeModule } from 'primeng/badge';;
import { ProgressBarModule } from 'primeng/progressbar';
import { PrimeNG } from 'primeng/config';


@Component({
  selector: 'app-school-insert',
  imports: [CommonModule, InputTextModule, FormsModule, ReactiveFormsModule, ButtonModule, ConfirmDialogModule, ToastModule, FileUploadModule, BadgeModule, ProgressBarModule],
  providers: [ConfirmationService, MessageService],
  templateUrl: './school-insert.html',
  styleUrl: './school-insert.css',
  standalone: true
})
export class SchoolInsert{
  @ViewChild('imageUpload') fileUploadComponent!: FileUpload;

  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private config = inject(PrimeNG);

  frmInsertSchool: FormGroup;

  get nameSchoolfb() { return this.frmInsertSchool.controls['nameSchool']; }
  get imageSchoolfb() {return this.frmInsertSchool.controls['imageSchool'];}

  constructor(private formBuilder: FormBuilder, private api: Api){
    this.frmInsertSchool = formBuilder.group({
      'nameSchool': ['', [Validators.required]],
      'imageSchool': [Blob, Validators.required]
    });
  }

  sendInsertSchool(event: Event): void{
    if (!this.frmInsertSchool.valid) {
      this.frmInsertSchool.markAllAsTouched();
      this.frmInsertSchool.markAllAsDirty();

      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Complete los datos fatantes. Por favor.' });
      return
    }

    confirmAction(this.confirmationService, event, '¿Desea ingresar esta escuela?', () => {
      const bodyParams: Registerschool$Params = {
        body: {
          nameSchool: this.nameSchoolfb.value,
          file: this.imageSchoolfb.value
        }
      };

      this.api.invoke(registerschool, bodyParams).then((response: any) => {
        const registerSchool = typeof response === 'string' ? JSON.parse(response) : response;
        this.frmInsertSchool.reset();
        this.frmInsertSchool.get('imageSchool')?.setValue(null);
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

    this.frmInsertSchool.patchValue({ imageSchool: this.files[0] });
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
