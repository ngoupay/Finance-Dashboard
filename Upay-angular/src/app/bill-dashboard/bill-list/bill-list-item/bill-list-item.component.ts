import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-bill-list-item',
  templateUrl: './bill-list-item.component.html',
  styleUrls: ['./bill-list-item.component.css']
})
export class BillListItemComponent implements OnInit {

  constructor() { }
  @Input() bill;
  isDescriptionExpanded = false;
  private readonly descriptionToggleThreshold = 90;

  ngOnInit() {
    console.log(this.bill)
  }

  getDescription(): string {
    if (!this.bill || this.bill.description === undefined || this.bill.description === null) {
      return '-';
    }

    const text = String(this.bill.description).trim();
    if (!text || text.toLowerCase() === 'undefined') {
      return '-';
    }

    return text;
  }

  canToggleDescription(): boolean {
    return this.getDescription().length > this.descriptionToggleThreshold;
  }

  toggleDescription() {
    this.isDescriptionExpanded = !this.isDescriptionExpanded;
  }

}
