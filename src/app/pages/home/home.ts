import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent {
  features = [
    {
      icon: '🔍',
      title: 'Search Characters',
      description: 'Find your favorite characters from across the multiverse'
    },
    {
      icon: '📊',
      title: 'Detailed Info',
      description: 'View comprehensive details about each character'
    },
    {
      icon: '🌌',
      title: 'Explore Universe',
      description: 'Discover characters from different dimensions'
    }
  ];
}