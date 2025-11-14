import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.html',
  styleUrls: ['./about.css']
})
export class AboutComponent {
  technologies = [
    { name: 'Angular 19', icon: '🅰️' },
    { name: 'TypeScript', icon: '📘' },
    { name: 'RxJS', icon: '🔄' },
    { name: 'Rick and Morty API', icon: '🛸' }
  ];

  features = [
    'Server-side search with URL parameters',
    'Lazy loading routes for optimal performance',
    'Responsive design for all devices',
    'Real-time character search',
    'Detailed character information',
    'Error handling and loading states'
  ];
}