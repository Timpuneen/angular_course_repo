import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; 
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProfileService, UserProfile } from '../../services/profile.service';
import { User } from '@angular/fire/auth';
import { switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  userProfile: UserProfile | null = null;
  isLoading: boolean = true;
  isUploading: boolean = false;
  uploadError: string = '';

  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.pipe(
      tap(user => {
        this.user = user;
        if (!user) {
          this.isLoading = false;
          this.router.navigate(['/login']);
        }
      }),
      switchMap(user => {
        if (user) {
          return this.profileService.getUserProfile(user.uid);
        }
        return [];
      })
    ).subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
      this.uploadError = 'Please select a JPG or PNG image';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.uploadError = 'Image size must be less than 5MB';
      return;
    }

    this.uploadError = '';
    this.isUploading = true;

    this.profileService.uploadProfilePicture(file).subscribe({
      next: (url) => {
        console.log('Profile picture uploaded:', url);
        
        if (this.userProfile) {
          this.userProfile.profilePictureUrl = url;
        } else {
          this.userProfile = { profilePictureUrl: url };
        }
        
        this.isUploading = false;
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.uploadError = 'Failed to upload image. Please try again.';
        this.isUploading = false;
      }
    });
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        this.router.navigate(['/login']);
      }
    });
  }

  getAccountAge(): string {
    if (!this.user?.metadata.creationTime) return 'Unknown';
    
    const created = new Date(this.user.metadata.creationTime);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return '1 day';
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  }
}