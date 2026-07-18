import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

interface SliderItem {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
}

@Component({
  selector: 'app-interactive-slider',
  standalone: true,
  imports: [CommonModule, ButtonModule, RippleModule],
  templateUrl: './interactive-slider.component.html',
  styleUrl: './interactive-slider.component.css'
})
export class InteractiveSliderComponent implements OnInit, OnDestroy {

  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  // Lista estática de elementos en el orden de carga deseado (no se rotará el array físicamente)
  public items: SliderItem[] = [
    {
      id: 1,
      subtitle: 'Módulo de Seguridad',
      title: 'GESTIÓN DE IDENTIDAD Y ACCESOS',
      description: 'El sistema provee un entorno seguro y centralizado donde cada usuario ingresa con credenciales únicas. Dependiendo de su rol (administrador, docente o estudiante), la plataforma redirige automáticamente a su espacio correspondiente.',
      image: '/Interactive%20Card%20Opening/1.jpg'
    },
    {
      id: 2,
      subtitle: 'Estructura Universitaria',
      title: 'ESTRUCTURA INSTITUCIONAL',
      description: 'Panel de control maestro para digitalizar el esqueleto de la universidad. Permite a los administradores registrar, configurar y mantener actualizados los catálogos de escuelas profesionales, periodos y semestres.',
      image: '/Interactive%20Card%20Opening/2.jpg'
    },
    {
      id: 3,
      subtitle: 'Logística Académica',
      title: 'MATRÍCULAS Y PLANIFICACIÓN',
      description: 'El motor logístico del sistema. Este servicio permite registrar los cursos disponibles, matricular estudiantes, organizarlos en grupos específicos y estructurar los horarios de clase en forma ordenada.',
      image: '/Interactive%20Card%20Opening/3.jpg'
    },
    {
      id: 4,
      subtitle: 'Portal de Profesores',
      title: 'HERRAMIENTAS DOCENTES',
      description: 'Un servicio dedicado exclusivamente a facilitar el trabajo operativo de los docentes. Permite visualizar grupos asignados y agilizar las evaluaciones cargando y procesando notas mediante archivos Excel.',
      image: '/Interactive%20Card%20Opening/4.jpg'
    },
    {
      id: 5,
      subtitle: 'Portal del Alumno',
      title: 'AUTOGESTIÓN ESTUDIANTIL',
      description: 'Espacio personal e interactivo diseñado para el alumno. Permite consultar horarios de clase vigentes y monitorear récords de calificaciones en tiempo real de forma autónoma.',
      image: '/Interactive%20Card%20Opening/5.jpg'
    },
    {
      id: 6,
      subtitle: 'Gestión Documental',
      title: 'REPORTES Y DOCUMENTOS',
      description: 'Automatiza la creación de archivos. Permite desde la carga y almacenamiento de fotos de perfil hasta la generación y descarga dinámica de reportes de notas y constancias en formato PDF.',
      image: '/Interactive%20Card%20Opening/6.jpg'
    }
  ];

  public activeIndex = 0;
  private autoplayInterval: any;

  ngOnInit(): void {
    console.log('InteractiveSliderComponent: Inicializado (ngOnInit)');
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    console.log('InteractiveSliderComponent: Destruido (ngOnDestroy)');
    this.stopAutoplay();
  }

  private startAutoplay(): void {
    console.log('InteractiveSliderComponent: Iniciando temporizador autoplay');
    this.autoplayInterval = setInterval(() => {
      console.log('InteractiveSliderComponent: Autoplay tick - Avanzando diapositiva');
      this.ngZone.run(() => {
        this.moveNext();
      });
    }, 5500); // Autoplay cada 5.5 segundos
  }

  private stopAutoplay(): void {
    if (this.autoplayInterval) {
      console.log('InteractiveSliderComponent: Deteniendo temporizador autoplay');
      clearInterval(this.autoplayInterval);
    }
  }

  private resetAutoplay(): void {
    this.stopAutoplay();
    this.startAutoplay();
  }

  public next(): void {
    console.log('InteractiveSliderComponent: Click manual Siguiente (next)');
    this.resetAutoplay();
    this.moveNext();
  }

  public prev(): void {
    console.log('InteractiveSliderComponent: Click manual Anterior (prev)');
    this.resetAutoplay();
    this.movePrev();
  }

  private moveNext(): void {
    this.activeIndex = (this.activeIndex + 1) % this.items.length;
    this.cdr.detectChanges(); // Forzar renderizado
  }

  private movePrev(): void {
    this.activeIndex = (this.activeIndex - 1 + this.items.length) % this.items.length;
    this.cdr.detectChanges(); // Forzar renderizado
  }

  // Retorna la clase de ranura (slot-0, slot-1, slot-2, slot-3) en base al activeIndex
  public getSlotClass(index: number): string {
    const n = this.items.length;
    const slot = (index - this.activeIndex + n) % n;
    return `slot-${slot}`;
  }

  public get progressPercentage(): number {
    return ((this.activeIndex + 1) / this.items.length) * 100;
  }

  public trackById(index: number, item: SliderItem): number {
    return item.id;
  }
}
