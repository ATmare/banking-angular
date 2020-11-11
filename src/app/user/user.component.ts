import {Component, ComponentFactoryResolver, ComponentRef, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {WidgetComponent} from '../widget/widget.component';
import {Account, Transaction} from '../api/Api';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {
  accounts: Account[] = [];
  baseUrl = 'http://localhost:10101';
  @ViewChild('parent', {read: ViewContainerRef}) target: ViewContainerRef;
  private componentRef: ComponentRef<any>;

  constructor(private http: HttpClient, private resolver: ComponentFactoryResolver) {
  }

  ngOnInit(): void {
    this.http.request<any>('GET', this.baseUrl + '/accounts').subscribe(data => {
      if (data) {
        this.accounts = data.accounts;
        for (const acc in this.accounts) {
          if (this.accounts.hasOwnProperty(acc)) {
            const path = '/transactions/' + this.accounts[acc].iban;
            this.http.request<any>('POST', this.baseUrl + path).subscribe(trans => {
              if (trans) {
                this.accounts[acc].transactions = trans.transactions;
              }
            });
          }
        }
      }
    });
  }

  addComponent() {
    let childComponent = this.resolver.resolveComponentFactory(WidgetComponent);
    this.componentRef = this.target.createComponent(childComponent); // TODO: lieber mit ngFor das ganze
  }
}
