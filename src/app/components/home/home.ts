import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Header } from '../header/header';
import { HerramientaService } from '../../services/herramienta';
import { AccesorioService } from '../../services/accesorio';
import { ProyectoService } from '../../services/proyecto';
import { MelamineService } from '../../services/melamine';
import { AuthService } from '../../services/auth-service';
import { Herramienta } from '../../models/herramienta';
import { Accesorio } from '../../models/accesorio';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, Header],
  templateUrl: './home.html',
})
export class Home implements OnInit {
  private herramientaSvc = inject(HerramientaService);
  private accesorioSvc = inject(AccesorioService);
  private proyectoSvc = inject(ProyectoService);
  private melamineSvc = inject(MelamineService);
  private authSvc = inject(AuthService);

  cargando = true;
  totalHerramientas = 0;
  totalAccesorios = 0;
  totalProyectos = 0;
  totalMelamine = 0;
  totalAdmins = 0;
  totalUsers = 0;

  estadoHerramientas: { label: string; value: number; pct: number }[] = [];
  categoriasAccesorios: { label: string; value: number; pct: number }[] = [];
  tiposUsuarios: { label: string; value: number; pct: number }[] = [];
  isAdmin = inject(AuthService).getRol() === 'ADMIN';

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    let pending = 4;

    const done = () => {
      pending--;
      if (pending <= 0) {
        this.calcularUsuarios();
        this.cargando = false;
      }
    };

    this.herramientaSvc.listar().subscribe({
      next: (data: Herramienta[]) => {
        this.totalHerramientas = data.length;
        const map = new Map<string, number>();
        data.forEach((h) => {
          const e = (h.estado || 'Sin estado').toLowerCase();
          map.set(e, (map.get(e) || 0) + 1);
        });
        const max = Math.max(...Array.from(map.values()), 1);
        this.estadoHerramientas = Array.from(map.entries()).map(([label, value]) => ({
          label,
          value,
          pct: (value / max) * 100,
        }));
        done();
      },
      error: () => done(),
    });

    this.accesorioSvc.listar().subscribe({
      next: (data: Accesorio[]) => {
        this.totalAccesorios = data.length;
        const map = new Map<string, number>();
        data.forEach((a) => {
          const c = a.categoria || 'Otros';
          map.set(c, (map.get(c) || 0) + 1);
        });
        const max = Math.max(...Array.from(map.values()), 1);
        this.categoriasAccesorios = Array.from(map.entries()).map(([label, value]) => ({
          label,
          value,
          pct: (value / max) * 100,
        }));
        done();
      },
      error: () => done(),
    });

    this.proyectoSvc.listar().subscribe({
      next: (data) => {
        this.totalProyectos = data.length;
        done();
      },
      error: () => done(),
    });

    this.melamineSvc.listar().subscribe({
      next: (data) => {
        this.totalMelamine = data.length;
        done();
      },
      error: () => done(),
    });
  }

  calcularUsuarios(): void {
    const locales = this.authSvc.getLocalUsers();
    const rol = this.authSvc.getRol();
    const current = this.authSvc.getUsername();
    let admins = rol === 'ADMIN' ? 1 : 0;
    let users = rol === 'USER' ? 1 : 0;
    locales.forEach((u) => {
      if (u['rol'] === 'ADMIN') admins++;
      else users++;
    });
    if (current && !locales.find((u) => u['username'] === current)) {
      // already counted via rol
    }
    this.totalAdmins = Math.max(admins, rol === 'ADMIN' ? 1 : 0);
    this.totalUsers = users + locales.filter((u) => u['rol'] === 'USER').length;
    const max = Math.max(this.totalAdmins, this.totalUsers, 1);
    this.tiposUsuarios = [
      { label: 'Administrador', value: this.totalAdmins, pct: (this.totalAdmins / max) * 100 },
      { label: 'Almacenero', value: this.totalUsers, pct: (this.totalUsers / max) * 100 },
    ];
  }
}
