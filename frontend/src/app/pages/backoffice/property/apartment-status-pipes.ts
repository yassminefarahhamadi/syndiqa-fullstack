import { Pipe, PipeTransform } from '@angular/core';

interface Apartment {
  status?: string;
}

@Pipe({
  name: 'occupiedCount',
  standalone: true
})
export class OccupiedCountPipe implements PipeTransform {
  transform(apartments: Apartment[]): number {
    return apartments?.filter(apt => apt.status?.toLowerCase() === 'occupied').length || 0;
  }
}

@Pipe({
  name: 'availableCount',
  standalone: true
})
export class AvailableCountPipe implements PipeTransform {
  transform(apartments: Apartment[]): number {
    return apartments?.filter(apt => apt.status?.toLowerCase() === 'available').length || 0;
  }
}

@Pipe({
  name: 'maintenanceCount',
  standalone: true
})
export class MaintenanceCountPipe implements PipeTransform {
  transform(apartments: Apartment[]): number {
    return apartments?.filter(apt => apt.status?.toLowerCase() === 'maintenance').length || 0;
  }
}
