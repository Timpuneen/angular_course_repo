import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ItemsService, Item } from '../../services/item.service';

@Component({
  selector: 'app-item-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './item-details.html',
  styleUrls: ['./item-details.css']
})
export class ItemDetailsComponent implements OnInit {
  item: Item | null = null;
  loading = true;
  error = false;
  notFound = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private itemsService: ItemsService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadItem(id);
      } else {
        this.notFound = true;
        this.loading = false;
      }
    });
  }

  loadItem(id: string) {
    this.loading = true;
    this.error = false;
    this.notFound = false;

    this.itemsService.getItemById(id).subscribe({
      next: (item) => {
        this.item = item;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading item:', err);
        this.loading = false;
        
        if (err.status === 404) {
          this.notFound = true;
          this.errorMessage = `Character with ID ${id} not found.`;
        } else {
          this.error = true;
          this.errorMessage = 'Failed to load character details. Please try again later.';
        }
      }
    });
  }

  goBack() {
    this.location.back();
  }

  goToList() {
    this.router.navigateByUrl('/items');
  }

  getEpisodeCount(): number {
    return this.item?.episode?.length || 0;
  }
}