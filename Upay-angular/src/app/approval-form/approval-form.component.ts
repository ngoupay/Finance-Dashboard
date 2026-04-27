import { VendorDetailsComponent } from './vendor-details/vendor-details.component';
import { SalaryDetailsComponent } from './salary-details/salary-details.component';
import { UtilizationDetailsComponent } from './utilization-details/utilization-details.component';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApprovalFormService } from './../service/approval-form.service';
import { SettingsService } from './../service/settings.service';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: 'app-approval-form',
  templateUrl: './approval-form.component.html',
  styleUrls: ['./approval-form.component.css']
})
export class ApprovalFormComponent implements OnInit, OnDestroy {
  approvalInput: number;
  requisitionPlaceholder = 'Requisition amount';
  payeePlaceholder: string;
  accountnoPlaceholder: string;
  banknamePlaceholder: string;
  ifscPlaceholder: string;
  unutilizedAmount: string;

  private unutilizedSubscription: Subscription;

  public bill: {
    number: string,
    amount: string,
    vendor: string,
    itemDesc: string,
    file: File | null
  }
  bills: any[];

  public salary: {
    number: string,
    amount: string,
    employee: string,
    itemDesc: string,
    file: File | null
  }
  salaries: any[];

  public vendor: {
    number: string,
    amount: number,
    vendorname: string,
    vendorAdd: string,
    preferance: string,
    deliveryschedule: string,
    paymentterms: string,
    unitprice: string,
    netamount: number,
    tax: number,
    remarks: string,
    file: File | null
  }

  vendors: any[];
  //Update form 
  updateApproval: any;
  public queryData: {
    id: string;
    claimId: string;
    trackflag: string;
    token: string;
  };
  constructor(public approvalFormService: ApprovalFormService, private approvalService: ApprovalFormService, public settingsService: SettingsService, private snackBar: MatSnackBar, private route: ActivatedRoute) {
    if (
      this.route.snapshot.queryParams.approvalId
    ) {
      this.queryData = {
        id: this.route.snapshot.queryParams.approvalId,
        claimId: this.route.snapshot.queryParams.claimid || 'undefined',
        trackflag: this.route.snapshot.queryParams.claimid || 'true',
        token: this.route.snapshot.queryParams.token || ''
      };
    }

    this.bill = {
      number: "",
      amount: "",
      vendor: "",
      itemDesc: "",
      file: null
    }
    this.bills = [this.bill];

    this.salary = {
      number: "",
      amount: "",
      employee: "",
      itemDesc: "",
      file: null
    };
    this.salaries = [this.salary]

    this.vendor = {
      number: "",
      amount: 0.0,
      vendorname: "",
      vendorAdd: "",
      preferance: "",
      deliveryschedule: "",
      paymentterms: "",
      unitprice: "",
      netamount: 0.0,
      tax: 0.0,
      remarks: "",
      file: null
    };
    this.vendors = [this.vendor];
  }
  isOTP = false;
  isOTPVerified = 0;
  isSubmitted;
  isLoading = false;
  approvalForm;
  approvalInputValue = 0;
  private defaultRequisitionPlaceholder = 'Requisition amount';
  approvalPlaceholder = 'Approval/Utilization Details (Item, Amount, Vendor and Bill Details)';
  private otpVerificationSubscription: Subscription;
  private formSubmitSubscription: Subscription;
  private zoneSubscription: Subscription;
  zones = [];
  approvals = [];
  approvalFile;
  invalidAdvanceID = false;
  sectionSlNoMappings = [
    {
      code: '1A',
      title: 'Approving Authority for non-financial proposal',
      label: 'Section 1A - Approving Authority for non-financial proposal',
      slNos: [
        '1a. New zone expansion approval',
        '1b. New Center expansion approval',
        '2. EBM & Zonal Team selection',
        '3. Opening and Closing of Bank account'
      ]
    },
    {
      code: '1B',
      title: 'Controlling Authority for non-financial proposal',
      label: 'Section 1B - Controlling Authority for non-financial proposal',
      slNos: [
        '1. CSR Proposal',
        '2. 80 G Donation Receipt',
        '3. Digital Signature',
        '4. External Training',
        '5. Press release and external representation'
      ]
    },
    {
      code: '2A',
      title: 'Purchases of materials/items/services by direct payments to vendors',
      label: 'Section 2A - Purchases of materials/items/services by direct payments to vendors',
      slNos: [
        '1. In-principle/Administrative approval for cost estimate & specification vetting',
        '2. Award approvals of POs and approval for mode of tendering',
        '3. Approval for deviation in PO value and amendment in PO',
        '4. Approval for cancellation/closure of PO',
        '5. Approval for extension in time duration of PO',
        '6. Approval for advance/payments to vendors as provided in PO'
      ]
    },
    {
      code: '2B',
      title: 'Proposal for Advances, claims to individuals for procurement of material and services',
      label: 'Section 2B - Proposal for Advances, claims to individuals for procurement of material and services',
      slNos: [
        '1. Approval for advance/imprest and claims against expenditures to individuals',
        '2. Approval for sanction of advance to paid staff',
        '3. Approval for waiving off advance or relaxation in repayment duration',
        '4. Approval for advance/reimbursement for travel expenditure',
        '5. Honorarium'
      ]
    },
    {
      code: '2C',
      title: 'Approval of funds for other than routine operations and functions',
      label: 'Section 2C - Approval of funds for other than routine operations and functions',
      slNos: [
        '1. Approval of funds (contingency/disaster/emergency)',
        '2. Award of scholarships and sponsorships',
        '3. Expenditure for disaster relief and emergency/contingency funds'
      ]
    },
    {
      code: '3',
      title: 'Powers delegated w.r.t. write off, sale of items and others',
      label: 'Section 3 - Powers delegated w.r.t. write off, sale of items and others',
      slNos: [
        '1. Approval for write-off of items (theft/loss/obsolete/unserviceable items)',
        '2. Approval for sale of scrap/old items',
        '3. Approval for sale of new items'
      ]
    },
    {
      code: '4',
      title: 'Power to quote rates on behalf of UPAY',
      label: 'Section 4 - Power to quote rates on behalf of UPAY',
      slNos: [
        '1. Approval of rates for supply/services and acceptance of purchase orders'
      ]
    },
    {
      code: '5',
      title: 'Appointments',
      label: 'Section 5 - Appointments',
      slNos: [
        '1. Appointment of staff/trainee with stipend/remuneration'
      ]
    },
    {
      code: '6',
      title: 'General Instructions',
      label: 'Section 6 - General Instructions',
      slNos: []
    }
  ];
  filteredSections = this.sectionSlNoMappings;
  filteredSlNos: string[] = [];
  selectedSectionLabel = '';
  selectedSectionCode = '';
  selectedSlNo = '';


  /* no change */
  ngOnInit() {
    this.settingsService.getZoneList();
    this.otpVerificationSubscription = this.approvalFormService.getOTPVerificationListener()
      .subscribe((res) => {
        this.isOTPVerified = res as any;
      });
    this.formSubmitSubscription = this.approvalFormService.getFormSubmitListener()
      .subscribe((res) => {
        this.isSubmitted = res as any;
        if (res && this.isSubmitted.approvalId) {
          this.approvalForm.reset();
          this.openSnackBar('Approval sent successfully');
          this.isLoading = false;
        } else if (res === 2) {
          this.openSnackBar('Approval could not be submitted');
          this.isLoading = false;
        }
      });

    this.zoneSubscription = this.settingsService.getZoneSubjectListener().subscribe((res) => {
      this.zones = res as any;
    });

    this.approvals.push({ name: 'In Principle or Admin Approval', value: 0 });
    this.approvals.push({ name: 'Advance', value: 1 });
    this.approvals.push({ name: 'Imprest', value: 6 });
    this.approvals.push({ name: 'Claim against advance/PO', value: 2 });
    this.approvals.push({ name: 'Claim', value: 3 });
    this.approvals.push({ name: 'Award Approval', value: 4 });
    this.approvals.push({ name: 'Salary', value: 5 });

    if (this.queryData) {
      this.getApprovalData();

      this.approvalService
        .getApprovalListener()
        .subscribe((res: any) => {
          this.updateApproval = res;
          if (this.updateApproval.fileName) {
            this.approvalFile = {
              name: this.updateApproval.fileName.replace(/^[^-]+-/, "")
            }
          }

          if (this.updateApproval.approval_type == 'Claim against advance/PO') {
            this.getUntilizedamt(null, this.updateApproval.approvalId);
          }

          if (this.updateApproval.approval_type === 'Advance or Imprest' || this.updateApproval.approval_type === 'Advance' || this.updateApproval.approval_type === 'Imprest' || this.updateApproval.approval_type === 'Claim against advance/PO' || this.updateApproval.approval_type === 'Claim') {
            this.getBillData();
            this.approvalService
              .getBillListener()
              .subscribe((res: any) => {
                if (res && res.length) {
                  this.bills = [];
                  for (const bill of res) {
                    let _bill = {
                      number: bill.billnumber || "",
                      amount: bill.billamount || "",
                      vendor: bill.vendorname || "",
                      itemDesc: bill.description || "",
                      project: bill.project || "",
                      budgetHead: bill.budgetHead || "",
                      budgetSubHead: bill.budgetSubHead || "",
                      assetDetails: bill.assetdetails || "",
                      assetValue: bill.assetvalue || "",
                      assetCodes: bill.assetcodes || "",
                      file: null,
                      _id: bill._id
                    }
                    if (bill.fileName) {
                      _bill.file = {
                        name: bill.fileName
                      }
                    }
                    this.bills.push(_bill);
                  }
                }
              });

          } else if (this.updateApproval.approval_type === 'Award Approval') {
            this.getVendorData();
            this.approvalService
              .getAwardListener()
              .subscribe((res: any) => {
                console.log(res);
                if (res && res.length) {
                  this.vendors = [];
                  for (const vendor of res) {
                    let _vendor = {
                      number: vendor.billnumber || "",
                      amount: vendor.billamount || 0.0,
                      vendorname: vendor.vendorname || "",
                      vendorAdd: vendor.vendor_addr || "",
                      preferance: vendor.vendor_preference || "",
                      deliveryschedule: vendor.deliveryschedule || "",
                      paymentterms: vendor.payterms || "",
                      unitprice: vendor.unitprice || "",
                      netamount: vendor.netbillamount || 0.0,
                      tax: vendor.gst_tax || 0.0,
                      remarks: vendor.description_warranty || "",
                      shipping: vendor.shipping_handling_chrg || "",
                      file: null,
                      _id: vendor._id
                    }
                    if (vendor.fileName) {
                      _vendor.file = {
                        name: vendor.fileName
                      }
                    }

                    this.vendors.push(_vendor)
                  }
                }
              });
          } else if (this.updateApproval.approval_type === 'Salary') {
            this.getSalaryData()
            this.approvalService.
              getSalaryListener()
              .subscribe((res: any) => {
                console.log(res);
                if (res && res.length) {
                  this.salaries = [];
                  for (const salary of res) {
                    let _salary = {
                      number: salary.salarynumber || "",
                      amount: salary.salaryamount || "",
                      employee: salary.employeename || "",
                      itemDesc: salary.description || "",
                      file: null,
                      _id: salary._id
                    };

                    if (salary.fileName) {
                      _salary.file = {
                        name: salary.fileName
                      }
                    }

                    this.salaries.push(_salary)
                  }
                }
              });
          }
        });
    }

  }

  onSubmit(approvalForm) {
    if (approvalForm.invalid || this.isOTPVerified !== 1) {
      return;
    }
    if (this.approvalInputValue == 2 && this.invalidAdvanceID) {
      this.snackBar.open("Invalid Advance ID", null, {
        duration: 5000,
        verticalPosition: 'top',
        panelClass: 'failure'
      });
      return
    }

    if (this.isBillBasedApprovalType(approvalForm.value.approval) && !this.requisitionAmountMatchesBillTotal(approvalForm.value.amount)) {
      this.snackBar.open("Requisite amount should match the sum of all the bill amounts", undefined, {
        duration: 5000,
        verticalPosition: 'top',
        panelClass: 'failure'
      });
      return;
    }

    this.isLoading = true;
    this.approvalForm = approvalForm;
    approvalForm.value.bills = this.bills;
    approvalForm.value.vendors = this.vendors;
    approvalForm.value.salaries = this.salaries;
    //console.log(approvalForm.value)
    let data = { ...approvalForm.value };
    if (this.updateApproval && this.updateApproval.approvalId) {
      data.approvalId = this.updateApproval.approvalId
    }
    if (this.updateApproval && this.updateApproval.claimId) {
      data.claimId = this.updateApproval.claimId
    }
    if (approvalForm.value.approval == 0) {
      /* 0 - In Principle or Admin Approval
        
      */
      this.approvalFormService.submitForm(data, this.approvalFile, this.approvals, this.queryData);
    } else {
      //console.log('TODO: New api',this.approvals[approvalForm.value.approval]);
      /* 2 - Claim against advance/PO
         4 - Award Approval
         5 - Salary
         
         Changes Done on 23/06/2021
         1 - Advance or Imprest
         3 - Claim
      */
      //console.log(approvalForm.value.advanceId)
      //console.log("submit form 2",approvalForm.value);
      this.approvalFormService.submitForm2(data, this.approvals, this.queryData);
    }

  }

  onImagePicked(event: Event) {
    this.approvalFile = (event.target as HTMLInputElement).files[0];
    if (this.approvalFile.size > 10485760) {
      this.approvalFile = null
      this.snackBar.open("File size should be less than 10MB", null, {
        duration: 5000,
        verticalPosition: 'top',
        panelClass: 'failure'
      });
    }
  }

  removeFile() {
    this.approvalFile = null
  }

  search(numberKey: string, myArray: any) {
    for (var i = 0; i < myArray.length; i++) {
      if (myArray[i].number === numberKey) {
        return myArray[i];
      }
    }
  }

  approvalChanged(value) {
    if (value === 4) {
      this.payeePlaceholder = 'L1 Vendor name';
      this.accountnoPlaceholder = 'L1 Vendor Account Number';
      this.banknamePlaceholder = 'L1 Vendor Bank Name';
      this.ifscPlaceholder = 'L1 Vendor Bank IFSC';
      this.approvalPlaceholder = 'Approval/Utilization Details';
    } else {
      this.payeePlaceholder = 'Payee Name';
      this.accountnoPlaceholder = 'Account Number';
      this.banknamePlaceholder = 'Bank Name';
      this.ifscPlaceholder = 'Bank IFSC';
      this.approvalPlaceholder = 'Approval/Utilization Details';
    }
    if (value == 2 || value == 3) {
      this.requisitionPlaceholder = 'Requisition amount: Sum of all the utilized amount';
    } else {
      this.requisitionPlaceholder = this.defaultRequisitionPlaceholder;
    }
    if (value == 0) {
      this.approvalPlaceholder = 'Justify your approval request';
    }
    this.resetSectionAndSlNo();
    this.approvalInputValue = value
  }

  resetSectionAndSlNo() {
    this.selectedSectionLabel = '';
    this.selectedSectionCode = '';
    this.selectedSlNo = '';
    this.filteredSections = this.sectionSlNoMappings;
    this.filteredSlNos = [];
  }

  onSectionInputChange(searchTerm: string) {
    const term = (searchTerm || '').trim().toLowerCase();
    this.filteredSections = this.sectionSlNoMappings.filter(section =>
      section.label.toLowerCase().includes(term)
    );

    const matchedSection = this.sectionSlNoMappings.find(section => section.label === searchTerm);
    if (!matchedSection) {
      this.selectedSectionCode = '';
      this.selectedSlNo = '';
      this.filteredSlNos = [];
    }
  }

  onSectionSelected(sectionLabel: string) {
    this.selectedSectionLabel = sectionLabel;
    const matchedSection = this.sectionSlNoMappings.find(section => section.label === sectionLabel);
    this.selectedSectionCode = matchedSection ? matchedSection.code : '';
    this.selectedSlNo = '';
    this.filterSlNos('');
  }

  filterSlNos(searchTerm: string) {
    const selectedSection = this.sectionSlNoMappings.find(section => section.code === this.selectedSectionCode);
    if (!selectedSection) {
      this.filteredSlNos = [];
      return;
    }

    const term = (searchTerm || '').trim().toLowerCase();
    this.filteredSlNos = selectedSection.slNos.filter(slNo => slNo.toLowerCase().includes(term));
  }

  sendOTP(phone) {
    this.isOTP = true;
    this.approvalFormService.sendOTP(phone);
  }
  verifyOTP(otp) {
    this.approvalFormService.verifyOTP(otp);
  }

  openSnackBar(message) {
    this.snackBar.open(message, null, {
      duration: 5000,
      verticalPosition: 'top',
      panelClass: this.isSubmitted.approvalId ? 'success' : 'failure'
    });
  }

  ngOnDestroy() {
    this.formSubmitSubscription.unsubscribe();
    this.otpVerificationSubscription.unsubscribe();
    this.zoneSubscription.unsubscribe();
  }

  addSalaryComponent() {
    var newSalary = {
      number: "",
      amount: "",
      employee: "",
      itemDesc: "",
      file: null
    };
    this.salaries.push(newSalary);
    //console.log(this.salaries);
  }
  addVendorComponent() {
    var newVendor = {
      number: "",
      amount: 0.0,
      vendorname: "",
      vendorAdd: "",
      preferance: "",
      deliveryschedule: "",
      paymentterms: "",
      unitprice: "",
      netamount: 0.0,
      tax: 0.0,
      remarks: "",
      file: null
    };
    this.vendors.push(newVendor);
    // console.log(this.vendors);
  }
  addBills() {
    var newBill = {
      number: "",
      amount: "",
      vendor: "",
      itemDesc: "",
      file: null
    }
    this.bills.push(newBill);
    //console.log(this.bills);
  }

  validateBillsFiles() {
    if (this.bills && (this.approvalInputValue == 2 || this.approvalInputValue == 3)) {
      for (let bill of this.bills) {
        if (!bill.file) {
          return false
        }
      }
    }
    return true
  }

  validateVendorFiles() {
    if (this.vendors && this.approvalInputValue == 4) {
      for (let vendor of this.vendors) {
        if (!vendor.file) {
          return false
        }
      }
    }
    return true
  }

  private isBillBasedApprovalType(approvalType: number): boolean {
    return [1, 2, 3, 6].indexOf(approvalType) !== -1;
  }

  private requisitionAmountMatchesBillTotal(requisitionAmount: string | number): boolean {
    const parsedRequisitionAmount = Number(requisitionAmount);
    if (isNaN(parsedRequisitionAmount)) {
      return false;
    }

    const totalBillAmount = (this.bills || []).reduce((total, bill) => {
      const billAmount = Number(bill && bill.amount);
      return total + (isNaN(billAmount) ? 0 : billAmount);
    }, 0);

    return Math.abs(parsedRequisitionAmount - totalBillAmount) < 0.01;
  }

  calculatePayableAmount(requisiteAmount: string | number, unutilizedAmount: string | number): number | '' {
    const requisiteRaw = requisiteAmount !== null && requisiteAmount !== undefined ? `${requisiteAmount}`.trim() : '';
    const unutilizedRaw = unutilizedAmount !== null && unutilizedAmount !== undefined ? `${unutilizedAmount}`.trim() : '';

    if (!requisiteRaw || !unutilizedRaw) {
      return '';
    }

    const parsedRequisite = Number(requisiteRaw);
    const parsedUnutilized = Number(unutilizedRaw);

    if (isNaN(parsedRequisite) || isNaN(parsedUnutilized)) {
      return '';
    }

    if (parsedRequisite > parsedUnutilized) {
      return parsedRequisite - parsedUnutilized;
    }

    return 0;
  }

  getUntilizedamt(event: any, id: any) {
    var advanceId = event && event.target ? event.target.value : id;
    if (advanceId !== undefined) {
      this.approvalService.getUnutilizedamt(advanceId)
    }
    this.unutilizedSubscription = this.approvalService.getUnutilizedamtListner().subscribe((res) => {
      if ((res as any).error_message) {
        this.unutilizedAmount = "Approval Id does not exist"
        this.invalidAdvanceID = true
      }
      else {
        this.unutilizedAmount = (res as any).unutilizedamount;
        this.invalidAdvanceID = false
      }
      //console.log(this.unutilizedAmount, res);
    });
  }

  getApprovalData() {
    this.approvalService.getSingleApproval(
      this.queryData.id,
      this.queryData.claimId,
      this.queryData.trackflag
    );
  }

  getBillData() {
    this.approvalService.getBillApproval(this.queryData.id);
  }

  getVendorData() {
    this.approvalService.getAwardApproval(this.queryData.id);
  }

  getSalaryData() {
    this.approvalService.getSalaryApproval(this.queryData.id);
  }

  filterApprovals(value) {
    if (value === 'Advance or Imprest') {
      value = 'Advance';
    }
    let approvalVal = this.approvals.find(item => item.name === value);
    if (approvalVal) {
      this.approvalChanged(approvalVal.value);
      return approvalVal.value;
    } else {
      return "";
    }
  }
}
