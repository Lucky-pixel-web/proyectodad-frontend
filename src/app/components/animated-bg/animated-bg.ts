import { Component, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router, NavigationEnd, RouterModule } from '@angular/router';

import { filter } from 'rxjs/operators';



const ROUTE_ICONS: Record<string, string[]> = {

  home: ['📊', '📈', '📉', '📋', '💹'],

  herramientas: ['🔧', '🔨', '⚙️', '🛠️', '🔩'],

  accesorios: ['📦', '🧰', '🔗', '🪝', '📎'],

  melamine: ['🪵', '📐', '🎨', '🪚', '📏'],

  proveedores: ['🏭', '🚚', '📋', '🏢', '🤝'],

  proyectos: ['📁', '📂', '🗂️', '🏗️', '📌'],

  usuarios: ['👤', '👥', '🪪', '🔐', '✉️'],

  clientes: ['👥', '📇', '🏠', '📞', '✉️'],

};



@Component({

  selector: 'app-animated-bg',

  standalone: true,

  imports: [CommonModule],

  template: `

    <div class="animated-bg" [class]="'bg-route-' + routeKey" aria-hidden="true">

      <span

        class="bg-float"

        *ngFor="let icon of icons; let i = index"

        [ngClass]="'bg-float-' + (i + 1)"

      >{{ icon }}</span>

    </div>

  `,

})

export class AnimatedBg {

  private router = inject(Router);

  icons: string[] = ROUTE_ICONS['home'];

  routeKey = 'home';



  constructor() {

    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.updateIcons());

    this.updateIcons();

  }



  private updateIcons(): void {

    const path = this.router.url.split('/')[1] || 'home';

    this.routeKey = path;

    this.icons = ROUTE_ICONS[path] || ROUTE_ICONS['home'];

  }

}


