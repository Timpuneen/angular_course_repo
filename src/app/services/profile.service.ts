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
  private worker?: Worker;

  constructor(
    private firestore: Firestore,
    private storage: Storage,
    private authService: AuthService
  ) {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('../workers/image-compressor.worker', import.meta.url));
    }
  }

  uploadProfilePicture(file: File): Observable<string> {
    return this.authService.currentUser$.pipe(
      take(1),
      switchMap(user => {
        if (!user) {
          return throwError(() => new Error('User not authenticated'));
        }

        console.log('[ProfileService] Starting upload for user:', user.uid);

        const compressionObservable = this.worker 
          ? this.compressWithWorker(file)
          : from(this.simpleCompress(file));

        return compressionObservable.pipe(
          switchMap(compressedBlob => {
            console.log('[ProfileService] Compression complete');
            
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

  private compressWithWorker(file: File): Observable<Blob> {
    return new Observable(observer => {
      if (!this.worker) {
        observer.error(new Error('Web Worker not available'));
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            observer.error(new Error('Failed to get canvas context'));
            return;
          }

          const MAX_SIZE = 400;
          let width = img.width;
          let height = img.height;

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
          ctx.drawImage(img, 0, 0, width, height);

          const imageData = ctx.getImageData(0, 0, width, height);

          this.worker!.postMessage({
            imageData,
            quality: 0.8
          });

          this.worker!.onmessage = ({ data }) => {
            if (data.error) {
              observer.error(new Error(data.error));
            } else if (data.blob) {
              console.log(`[Web Worker] Original: ${(file.size / 1024).toFixed(2)} KB`);
              console.log(`[Web Worker] Compressed: ${(data.blob.size / 1024).toFixed(2)} KB`);
              observer.next(data.blob);
              observer.complete();
            }
          };

          this.worker!.onerror = (error) => {
            observer.error(error);
          };
        };

        img.onerror = () => observer.error(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => observer.error(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

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

          const MAX_SIZE = 400;
          let width = img.width;
          let height = img.height;

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
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                console.log(`[Fallback] Original: ${(file.size / 1024).toFixed(2)} KB`);
                console.log(`[Fallback] Compressed: ${(blob.size / 1024).toFixed(2)} KB`);
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            0.8
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  ngOnDestroy() {
    if (this.worker) {
      this.worker.terminate();
    }
  }
}