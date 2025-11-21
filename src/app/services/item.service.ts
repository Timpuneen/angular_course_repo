import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Item {
  id: number;
  name: string;
  status: string;
  species: string;
  type: string;
  gender: string;
  image: string;
  origin: {
    name: string;
    url: string;
  };
  location: {
    name: string;
    url: string;
  };
  episode: string[];
  url: string;
  created: string;
}

export interface ApiResponse {
  info: {
    count: number;
    pages: number;
    next: string | null;
    prev: string | null;
  };
  results: Item[];
}

@Injectable({
  providedIn: 'root'
})
export class ItemsService {
  private apiUrl = 'https://rickandmortyapi.com/api/character';

  constructor(private http: HttpClient) {}

  getItems(query?: string, page: number = 1): Observable<ApiResponse> {
    let params = new HttpParams().set('page', page.toString());

    if (query && query.trim()) {
      params = params.set('name', query.trim());
    }

    const fullUrl = `${this.apiUrl}?${params.toString()}`;
    console.log('[ItemsService] getItems → URL:', fullUrl);

    return this.http.get<ApiResponse>(this.apiUrl, { params }).pipe(
      tap({
        next: (res) =>
          console.log('[ItemsService] getItems → SUCCESS:', res),
        error: (err) =>
          console.error('[ItemsService] getItems → ERROR:', err)
      })
    );
  }

  getItemById(id: string | number): Observable<Item> {
    const url = `${this.apiUrl}/${id}`;
    console.log('[ItemsService] getItemById → URL:', url);

    return this.http.get<Item>(url).pipe(
      tap({
        next: (res) =>
          console.log('[ItemsService] getItemById → SUCCESS:', res),
        error: (err) =>
          console.error('[ItemsService] getItemById → ERROR:', err)
      })
    );
  }

}
