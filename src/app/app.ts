import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AnimatedBg } from './components/animated-bg/animated-bg';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AnimatedBg, CommonModule],
  template: `
    <app-animated-bg *ngIf="showBg" />
    <router-outlet />
  `,
})
export class App {
  showBg = false;
  private router = inject(Router);

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      const url = (e as NavigationEnd).urlAfterRedirects;
      this.showBg = !url.includes('/login');
    });
  }
}
