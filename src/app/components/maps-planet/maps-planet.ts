import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { openGoogleMaps } from '../../utils/file-maps.util';

@Component({
  selector: 'app-maps-planet',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button type="button" class="maps-planet-btn" [title]="title" (click)="open()">
      <span class="planet-spin">🌍</span>
      <span class="planet-label">{{ label }}</span>
    </button>
  `,
})
export class MapsPlanet {
  @Input() query = '';
  @Input() label = 'Ver ubicación en tiempo real';
  @Input() title = 'Abrir en Google Maps';

  open(): void {
    openGoogleMaps(this.query || '');
  }
}
