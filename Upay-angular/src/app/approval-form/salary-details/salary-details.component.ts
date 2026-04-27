import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-salary-details',
  templateUrl: './salary-details.component.html',
  styleUrls: ['./salary-details.component.css']
})
export class SalaryDetailsComponent implements OnInit {
  projects = ['Reach & Teach', 'Footpathshala', 'Skill Development', 'Program Management', 'New Project'];
  salaryHeads = ['Program', 'Admin'];
  salarySubHeads = ['Teaching', 'Non teaching', 'HR', 'Finance', 'Outreach', 'Admin'];

  constructor() { }
  onsalaryImagePicked(event: Event,index:number) {
    console.log(index);
   const files = (event.target as HTMLInputElement).files;
   if (files && files.length) {
    this.salaries[index].file = files[0];
   }
 }
 onSalaryCsvPicked(event: Event, index: number) {
   const files = (event.target as HTMLInputElement).files;
   if (files && files.length) {
    this.salaries[index].csvFile = files[0];
   }
 }
 removesalaryItem(index:number){
   this.salaries.splice(index,1);
 }

  @Input() approval: number;
  @Input() salaries;
  @Input() salary;
  @Input() b;
  ngOnInit() {
   
  }

}
