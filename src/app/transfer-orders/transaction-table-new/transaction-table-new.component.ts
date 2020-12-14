import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Account, Transaction} from '../../api/Api';
import {MatTableDataSource} from '@angular/material/table';
import {DatePipe} from '@angular/common';
import {FormControl, FormGroup} from '@angular/forms';
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {UserService} from '../../services/user-service';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {FaIconLibrary} from '@fortawesome/angular-fontawesome';
import {faArrowCircleUp, faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-transaction-table-new',
  templateUrl: './transaction-table-new.component.html',
  styleUrls: ['./transaction-table-new.component.scss', '../../transaction-widget/transaction-widget.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class TransactionTableNewComponent implements OnInit, AfterViewInit, OnDestroy {

  account: Account = {iban: '', balance: 0.00, name: '', accountType: '', limit: 0};
  transactions: Transaction[];
  userdata = JSON.parse(localStorage.getItem('user'));
  filterActive = false;
  removable = true;
  displayedColumns: string[] = ['type', 'complementaryIban', 'text', 'timestamp', 'amount'];
  expandedElement: Transaction | null;
  dataSource = new MatTableDataSource(new Array<Transaction>());
  pipe: DatePipe;
  showDateError = false;
  transSub: Subscription;
  accSub: Subscription;

  filterForm = new FormGroup({
    fromDate: new FormControl(),
    toDate: new FormControl(),
  });

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(private userService: UserService, private library: FaIconLibrary) {
    library.addIcons(faArrowCircleUp, faInfoCircle);
  }

  ngOnInit(): void {
    this.accSub = this.userService.accountsWidgetSubject.subscribe(acc => {
      this.account = acc;
    });

    const defaultPredicate = this.dataSource.filterPredicate;
    this.dataSource.filterPredicate = (data: Transaction, filter) => {
      const formatted = this.pipe.transform(data.timestamp, 'MM/dd/yyyy');
      return formatted.indexOf(filter) >= 0 || defaultPredicate(data, filter);
    };

    this.transSub = this.userService.transactionFinanceSite.subscribe(trans => {
      this.transactions = trans.filter((t: Transaction) => t.amount < 0);
      this.dataSource = new MatTableDataSource(this.transactions);
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.paginator._intl.itemsPerPageLabel = 'Einträge pro Seite:';
    });
  }

  ngAfterViewInit(): void {
    this.filterForm.valueChanges.subscribe(data => {
      if (this.toDate != null && this.fromDate != null) {
        const toDate = new Date(this.getDate('toDate'));
        const fromDate = new Date(this.getDate('fromDate'));
        if (fromDate > toDate) {
          this.showDateError = true;
        } else {
          this.showDateError = false;
        }
      } else {
        this.showDateError = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.transSub.unsubscribe();
    this.accSub.unsubscribe();
  }

  get fromDate(): Date {
    return this.filterForm.get('fromDate').value;
  }

  get toDate(): Date {
    return this.filterForm.get('toDate').value;
  }

  getDateRange(): void {
    this.filterActive = true;
    this.dataSource.data = this.transactions;

    // TODO: Why creating date is not working with a method call??
    const toDate = new Date(this.getDate('fromDate'));
    const fromDate = new Date(this.getDate('toDate'));

    fromDate.setFullYear(
      this.filterForm.value.fromDate.year,
      this.filterForm.value.fromDate.month - 1,
      this.filterForm.value.fromDate.day
    );
    fromDate.setHours(0, 0, 0);
    toDate.setFullYear(
      this.filterForm.value.toDate.year,
      this.filterForm.value.toDate.month - 1,
      this.filterForm.value.toDate.day
    );
    toDate.setHours(23, 59, 59);

    this.dataSource.data = this.dataSource.data.filter(
      e => e.timestamp.getTime() >= fromDate.getTime() && e.timestamp.getTime() <= toDate.getTime()
    );
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  checkBalance(amount): string {
    if (amount >= 0) {
      return 'green';
    } else {
      return 'red';
    }
  }

  getDate(date): Date {
    const tempDate = new Date();
    if (date === 'fromDate') {
      tempDate.setFullYear(
        this.filterForm.value.fromDate.year,
        this.filterForm.value.fromDate.month - 1,
        this.filterForm.value.fromDate.day
      );
      tempDate.setHours(0, 0, 0);
    } else {
      tempDate.setFullYear(
        this.filterForm.value.toDate.year,
        this.filterForm.value.toDate.month - 1,
        this.filterForm.value.toDate.day
      );
      tempDate.setHours(23, 59, 59);
    }
    return tempDate;
  }

  clearFilters(): void {
    this.dataSource.filter = '';
    this.filterForm.reset();
    this.filterActive = false;
    this.dataSource.data = this.transactions;
  }

  getColumnName(column: string): string {
    if (column === 'text') {
      return 'Verwendungszweck';
    } else if (column === 'complementaryIban') {
      return 'Empfänger';
    } else if (column === 'amount') {
      return 'Betrag';
    } else if (column === 'timestamp') {
      return 'Datum';
    } else if (column === 'type') {
      return 'Art';
    } else {
      return column;
    }
  }

  getType(type): string {
    if (type === '') {
      return 'Standard';
    } else {
      return type;
    }
  }

  checkFutureDate(date): boolean {
    const tempDate = new Date(date);
    const now = new Date();
    return now < tempDate;
  }
}
