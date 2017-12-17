import { Component } from '@angular/core';
import { IonicPage, NavController, AlertController, ItemSliding } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { UserDataProvider } from '../../providers/user-data/user-data';

@IonicPage()
@Component({
  selector: 'page-my-lists',
  templateUrl: 'my-lists.html',
})
export class MyListsPage {

  lists: Observable<any[]>;

  constructor(public navCtrl: NavController, public alertCtrl: AlertController,
    public userData: UserDataProvider) { }

  ionViewDidLoad() {
    this.lists = this.userData.getUserLists();
  }

  onListClicked(listId: string, name: string) {
    this.navCtrl.push('ListDetailPage', {
      id: listId,
      name: name
    });
  }

  delete(slidingItem: ItemSliding, listId: string) {
    slidingItem.close();
    this.userData.deleteList(listId);
  }

  addList() {
    this.alertCtrl.create({
      title: 'Añadir lista',
      message: 'Introduce nombre y descripción de la nueva lista',
      inputs: [
        { name: 'name', placeholder: 'Nombre' },
        { name: 'description', placeholder: 'Descripción' }
      ],
      buttons: [
        { text: 'Cancel' },
        {
          text: 'Añadir',
          handler: data => {
            if (this.isValid(data.name, data.description)) {
              this.userData.createList(data.name, data.description);
            } else {
              return false;
            }
          }
        }
      ]
    }).present();
  }

  // New lists need name and description
  isValid(name: string, description: string) {
    return name && description;
  }
}
