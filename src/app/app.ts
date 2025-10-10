import { Component } from '@angular/core';
import { CharacterListComponent } from './character-list/character-list';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CharacterListComponent],
  template: `
    <app-character-list></app-character-list>
  `,
  styles: []
})
export class AppComponent {
  title = 'character-list-app';
}