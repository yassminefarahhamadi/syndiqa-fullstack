import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'roleBadge', standalone: true })
export class RoleBadgePipe implements PipeTransform {
    private readonly labels: Record<string, string> = {
        'SYNDIC_ADMIN': 'Admin',
        'PLATFORM_ADMIN': 'Platform Admin',
        'RESIDENT': 'Resident',
        'TECHNICAL_STAFF': 'Technician'
    };

    transform(role: string): string {
        return this.labels[role] ?? role;
    }
}
