import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // 👈 CRUCIAL

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule], // 👈 DEBE ESTAR AQUÍ
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
export class Header {}