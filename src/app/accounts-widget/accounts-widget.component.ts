import { Component, OnInit } from '@angular/core';
import {Account} from '../api/Api';
import {UserService} from '../services/user-service';
import {FaIconLibrary} from '@fortawesome/angular-fontawesome';
import {Router} from '@angular/router';
import {faPlus} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-accounts-widget',
  templateUrl: './accounts-widget.component.html',
  styleUrls: ['./accounts-widget.component.scss', './../accounts-dropdown/accounts-dropdown.component.scss']
})
export class AccountsWidgetComponent implements OnInit {
  accounts: Account[] = [{ iban: '',  balance: 0, name: '', accountType: '',  }];
  selectedAccount = { iban: '',  balance: 0, name: '', accountType: '',  };

  constructor(private userService: UserService, private library: FaIconLibrary, private router: Router) {
    library.addIcons(faPlus);
  }

  ngOnInit(): void {
    this.userService.getAllAccounts().subscribe((acc: { accounts: Account[] }) => {
      this.accounts = acc.accounts;
      this.selectedAccount = acc.accounts[0];
    });
  }

  async onSubmit(selectedAccount): Promise<void> {
    alert(JSON.stringify(selectedAccount));
    await this.router.navigateByUrl('/transaction/new_transaction').then( acc => {
      this.userService.accountsWidgetSubject.next(selectedAccount); });
  }

  hideAccountSum(acc): boolean {
    return acc.name !== 'Alle Konten';
  }

}