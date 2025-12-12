import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { AuthService } from './auth.service';
import { Observable, from, of, throwError } from 'rxjs';
import { switchMap, map, catchError, take } from 'rxjs/operators';

export interface UserProfile {
  profilePictureUrl?: string;
  displayName?: string;
  favorites?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  constructor(
    private firestore: Firestore,
    private storage: Storage,
    private authService: AuthService
  ) {}

  // Загрузить фото профиля (упрощённая версия)
  uploadProfilePicture(file: File): Observable<string> {
    return this.authService.currentUser$.pipe(
      take(1),
      switchMap(user => {
        if (!user) {
          return throwError(() => new Error('User not authenticated'));
        }

        console.log('[ProfileService] Starting upload for user:', user.uid);

        // Простое сжатие через canvas
        return from(this.simpleCompress(file)).pipe(
          switchMap(compressedBlob => {
            console.log('[ProfileService] Compression complete');
            
            // Загружаем в Firebase Storage
            const timestamp = Date.now();
            const filePath = `profile-pictures/${user.uid}/${timestamp}.jpg`;
            const storageRef = ref(this.storage, filePath);
            
            console.log('[ProfileService] Uploading to:', filePath);
            
            return from(uploadBytes(storageRef, compressedBlob)).pipe(
              switchMap(snapshot => {
                console.log('[ProfileService] Upload complete, getting URL');
                return from(getDownloadURL(snapshot.ref));
              }),
              switchMap(url => {
                console.log('[ProfileService] Got URL:', url);
                console.log('[ProfileService] Saving to Firestore');
                
                // Сохраняем URL в Firestore
                const docRef = doc(this.firestore, `users/${user.uid}`);
                return from(setDoc(docRef, { profilePictureUrl: url }, { merge: true })).pipe(
                  map(() => {
                    console.log('[ProfileService] Saved to Firestore successfully');
                    return url;
                  })
                );
              })
            );
          }),
          catchError(error => {
            console.error('[ProfileService] Error:', error);
            return throwError(() => error);
          })
        );
      })
    );
  }

  // Получить профиль пользователя
  getUserProfile(uid: string): Observable<UserProfile | null> {
    const docRef = doc(this.firestore, `users/${uid}`);
    
    return from(getDoc(docRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          return docSnap.data() as UserProfile;
        }
        return null;
      }),
      catchError(error => {
        console.error('[ProfileService] Error getting profile:', error);
        return of(null);
      })
    );
  }

  // Простое сжатие изображения (без Web Worker)
  private simpleCompress(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Максимальные размеры
          const MAX_SIZE = 400;
          let width = img.width;
          let height = img.height;

          // Масштабируем
          if (width > height) {
            if (width > MAX_SIZE) {
              height = (height * MAX_SIZE) / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = (width * MAX_SIZE) / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Рисуем
          ctx.drawImage(img, 0, 0, width, height);

          // Конвертируем в blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                console.log(`Original: ${(file.size / 1024).toFixed(2)} KB`);
                console.log(`Compressed: ${(blob.size / 1024).toFixed(2)} KB`);
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            0.8  // 80% качество
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
}
