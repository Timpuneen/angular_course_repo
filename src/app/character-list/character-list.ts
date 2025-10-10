import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface Character {
  id: number;
  name: string;
  status: string;
  species: string;
  image: string;
}

@Component({
  selector: 'app-character-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './character-list.html',
  styleUrls: ['./character-list.css']
})
export class CharacterListComponent {
  characters: Character[] = [];
  loading = false;

  constructor(private http: HttpClient) {}

  loadCharacters() {
    this.loading = true;
    
    this.http.get<any>('https://rickandmortyapi.com/api/character')
      .subscribe({
        next: (response) => {
          this.characters = response.results;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading characters:', error);
          this.loading = false;
        }
      });
  }
}