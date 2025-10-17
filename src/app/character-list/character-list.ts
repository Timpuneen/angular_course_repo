import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { CharacterService, Character } from '../services/character';

@Component({
  selector: 'app-character-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './character-list.html',
  styleUrls: ['./character-list.css']
})
export class CharacterListComponent implements OnInit, OnDestroy {
  characters: Character[] = [];
  loading = false;
  searchTerm = '';
  noResults = false;
  
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  constructor(private characterService: CharacterService) {}

  ngOnInit() {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(500), 
      distinctUntilChanged(), 
      switchMap(searchTerm => {
        this.loading = true;
        this.noResults = false;
        
        if (searchTerm.trim() === '') {
          return this.characterService.getCharacters();
        } else {
          return this.characterService.searchCharacters(searchTerm);
        }
      })
    ).subscribe({
      next: (response) => {
        this.characters = response.results;
        this.loading = false;
        this.noResults = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.characters = [];
        this.loading = false;
        this.noResults = true;
      }
    });
  }

  loadCharacters() {
    this.loading = true;
    this.noResults = false;
    
    this.characterService.getCharacters().subscribe({
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

  onSearchChange(searchValue: string) {
    this.searchSubject.next(searchValue);
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }
}