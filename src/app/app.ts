import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [FormsModule, CommonModule], 
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title: string = 'About Me';
  subtitle: string = 'Full Stack Developer & Student & 10k trophies ClashRoyale';
  name: string = 'Tima';
  role: string = 'FIT Student';
  description: string = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
  
  isLikeButtonDisabled: boolean = false;
  likes: number = 0;
  
  showThankYouMessage: boolean = false;
  
  incrementLikes(): void {
    this.likes++;
    console.log('Likes:', this.likes);
  }
  
  toggleThankYouMessage(): void {
    this.showThankYouMessage = !this.showThankYouMessage;
  }
  
  userName: string = '';
  userEmail: string = '';
  isSubscribed: boolean = false;
  
  subscribe(): void {
    if (this.userEmail.trim()) {
      this.isSubscribed = true;
      console.log('Subscribed:', this.userEmail);
    }
  }
  
  email: string = 'timpuh_work@mail.ru';
  phone: string = '+7 705 195 8843';
  linkedin: string = 'linkedin.com/in/timur-baltabayev/';
  github: string = 'github.com/timpuneen';
  
  skills: string[] = ['Angular', 'TypeScript', 'HTML/CSS', 'JavaScript', 'Git', 'Node.js'];
}