import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatSnackBar } from '@angular/material';
@Component({
  selector: 'app-utilization-details',
  templateUrl: './utilization-details.component.html',
  styleUrls: ['./utilization-details.component.css']
})
export class UtilizationDetailsComponent implements OnInit, OnChanges {

  projectOptions: string[] = [
    'Reach & Teach',
    'Footpathshala',
    'Skill Development',
    'Program Management',
    'New Project'
  ];
  filteredProjects: string[] = [];

  budgetHeadOptions: Array<{ code: string; title: string; display: string; subHeads: string[] }> = [
    {
      code: 'BH01',
      title: 'Center Operation',
      display: 'BH01 - Center Operation',
      subHeads: ['Teacher Salary/Allowances', 'Books & Stationary', 'Rental Charges', 'Misc']
    },
    {
      code: 'BH02',
      title: 'Center development',
      display: 'BH02 - Center development',
      subHeads: ['Establishment Cost', 'Electrical works & Appliances', 'Beautification & Advancement']
    },
    {
      code: 'BH03',
      title: 'Child Development activities',
      display: 'BH03 - Child Development activities',
      subHeads: ['Sports Activities', 'Cultural Activities', 'Career Development', 'Nutritional drives', 'Counseling & Immunization']
    },
    {
      code: 'BH04',
      title: 'Community Development',
      display: 'BH04 - Community Development',
      subHeads: ['Fellowship/ Capacity Building', 'Health, Environment & sanitation', 'Protection of child abuse drives', 'Other Social issues awareness']
    },
    {
      code: 'BH05',
      title: 'New Zonal / Project / Center Expansion',
      display: 'BH05 - New Zonal / Project / Center Expansion',
      subHeads: []
    },
    {
      code: 'BH06',
      title: 'Fund raiser events',
      display: 'BH06 - Fund raiser events',
      subHeads: ['Online Fundraiser cost', 'Fund raiser events']
    },
    {
      code: 'BH07',
      title: 'Legal & Statutory',
      display: 'BH07 - Legal & Statutory',
      subHeads: []
    },
    {
      code: 'BH08',
      title: 'Outreach',
      display: 'BH08 - Outreach',
      subHeads: ['Social & other Media', 'PR events/material']
    },
    {
      code: 'BH09',
      title: 'HR',
      display: 'BH09 - HR',
      subHeads: ['Hiring', 'Training', 'Employee Benefit']
    },
    {
      code: 'BH10',
      title: 'Administrative',
      display: 'BH10 - Administrative',
      subHeads: ['Employees salary', 'Rental Charges', 'Meetings & Travels', 'Misc Office expenditure']
    },
    {
      code: 'BH11',
      title: 'Library Operations',
      display: 'BH11 - Library Operations',
      subHeads: ['Establishment cost', 'Books & Magazines', "Librarian's Salary", 'Rental Charges']
    },
    {
      code: 'BH12',
      title: 'Skill Development',
      display: 'BH12 - Skill Development',
      subHeads: ['Establishment cost', 'Material', "Trainer's Salary", 'Trainees / Beneficiary Stipend', 'Rental Charges']
    },
    {
      code: 'BH13',
      title: 'Women Empowerment',
      display: 'BH13 - Women Empowerment',
      subHeads: ['Menstrual Hygiene', 'Other Empowerment Drive']
    },
    {
      code: 'BH14',
      title: 'Research & Development (Tech)',
      display: 'BH14 - Research & Development (Tech)',
      subHeads: ['Development (Tech & Others)', 'Research']
    },
    {
      code: 'BH15',
      title: 'Project Management',
      display: 'BH15 - Project Management',
      subHeads: ['Planning', 'Monitoring', 'Assessment']
    },
    {
      code: 'BH16',
      title: 'Disaster Relief',
      display: 'BH16 - Disaster Relief',
      subHeads: ['Disaster Relief']
    },
    {
      code: 'BH17',
      title: 'Contingency Funds',
      display: 'BH17 - Contingency Funds',
      subHeads: ['Emergency / Contingency support']
    }
  ];
  filteredBudgetHeads: Array<{ code: string; title: string; display: string; subHeads: string[] }> = [];
  filteredBudgetSubHeads: string[] = [];

  constructor(private snackBar: MatSnackBar) { }
  onbillImagePicked(event: Event, index: number) {
    this.bills[index].file = (event.target as HTMLInputElement).files[0];
    if (this.bills[index].file.size > 10485760) {
      this.bills[index].file = null
      this.snackBar.open("File size should be less than 10MB", null, {
        duration: 5000,
        verticalPosition: 'top',
        panelClass: 'failure'
      });
    }
  }
  removebillItem(index: number) {
    this.bills.splice(index, 1);
  }
  @Input() approval: number;
  @Input() bills;
  @Input() bill;
  @Input() b;
  ngOnInit() {
    this.initializeAutocompleteOptions();

  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.bill) {
      this.initializeAutocompleteOptions();
    }
  }

  onProjectInputChange(value: string) {
    const normalizedValue = this.normalizeValue(value);
    this.filteredProjects = this.projectOptions.filter((project) => this.normalizeValue(project).includes(normalizedValue));
  }

  onProjectSelected(value: string) {
    if (!this.bill) {
      return;
    }
    this.bill.project = value;
    this.onProjectInputChange(value);
  }

  onBudgetHeadInputChange(value: string) {
    const normalizedValue = this.normalizeValue(value);
    this.filteredBudgetHeads = this.budgetHeadOptions.filter((budgetHead) => {
      const searchableText = `${budgetHead.code} ${budgetHead.title} ${budgetHead.display}`;
      return this.normalizeValue(searchableText).includes(normalizedValue);
    });

    this.updateBudgetSubHeadOptions(value);
  }

  onBudgetHeadSelected(value: string) {
    if (!this.bill) {
      return;
    }
    this.bill.budgetHead = value;
    this.updateBudgetSubHeadOptions(value);
  }

  onBudgetSubHeadInputChange(value: string) {
    const selectedBudgetHeadValue = this.bill ? this.bill.budgetHead : '';
    const selectedBudgetHead = this.budgetHeadOptions.find((budgetHead) => budgetHead.display === selectedBudgetHeadValue);
    const subHeadOptions = selectedBudgetHead ? selectedBudgetHead.subHeads : [];
    const normalizedValue = this.normalizeValue(value);
    this.filteredBudgetSubHeads = subHeadOptions.filter((subHead) => this.normalizeValue(subHead).includes(normalizedValue));
  }

  onBudgetSubHeadSelected(value: string) {
    if (!this.bill) {
      return;
    }
    this.bill.budgetSubHead = value;
    this.onBudgetSubHeadInputChange(value);
  }

  private initializeAutocompleteOptions() {
    this.filteredProjects = [...this.projectOptions];
    this.filteredBudgetHeads = [...this.budgetHeadOptions];
    this.updateBudgetSubHeadOptions(this.bill ? this.bill.budgetHead : '');
  }

  private updateBudgetSubHeadOptions(selectedBudgetHead: string) {
    const selectedBudgetHeadOption = this.budgetHeadOptions.find((budgetHead) => budgetHead.display === selectedBudgetHead);
    const subHeadOptions = selectedBudgetHeadOption ? selectedBudgetHeadOption.subHeads : [];
    this.filteredBudgetSubHeads = [...subHeadOptions];

    if (this.bill && subHeadOptions.indexOf(this.bill.budgetSubHead) === -1) {
      this.bill.budgetSubHead = '';
    }
  }

  private normalizeValue(value: string): string {
    return (value || '').toString().trim().toLowerCase();

  }

}
