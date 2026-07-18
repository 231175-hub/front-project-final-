import { ConfirmationService } from 'primeng/api';

/**
 * Reusable helper function to display PrimeNG confirmation dialogs
 * with standard configuration, avoiding boilerplate code across components.
 * 
 * @param confirmationService The PrimeNG ConfirmationService instance
 * @param event The DOM event triggering the confirmation
 * @param message The message to show in the confirmation dialog
 * @param accept Callback function executed when accepted
 * @param reject Callback function executed when rejected (optional)
 */
export function confirmAction(
  confirmationService: ConfirmationService,
  event: Event,
  message: string,
  accept: () => void,
  reject?: () => void
): void {
  confirmationService.confirm({
    target: event.target as EventTarget,
    message: message,
    header: 'Confirmación',
    icon: 'pi pi-info-circle',
    rejectLabel: 'Cancel',
    rejectButtonProps: {
      label: 'Cancelar',
      severity: 'secondary',
      outlined: true
    },
    acceptButtonProps: {
      label: 'Aceptar',
      severity: 'primary'
    },
    accept,
    reject
  });
}
