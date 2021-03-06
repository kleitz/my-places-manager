import { Injectable } from '@angular/core';
import { AngularFireDatabase, AngularFireObject, AngularFireList } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import { HttpClient } from '@angular/common/http';
import firebase from 'firebase';

@Injectable()
export class UserDataProvider {

  uid: string;
  userRef: AngularFireObject<any>;
  userListsRef: AngularFireList<any>;
  listsRef: AngularFireList<any>;

  constructor(public db: AngularFireDatabase, public http: HttpClient) { }

  setUid(uid: string) {
    this.uid = uid;
    this.userRef = this.db.object(`users/${this.uid}`);
    this.userListsRef = this.db.list(`user-lists/${this.uid}`);
    this.listsRef = this.db.list('lists');
  }

  createUser(uid: string, email: string, bio: string, username: string) {
    let updates = {};
    
    updates[`/users/${uid}`] = {
      email: email,
      bio: bio,
      username: username
    };

    // Every new user has a favorites empty list by default
    let listId =  this.db.database.ref(`user-lists/${uid}`).push().key;
    updates[`/user-lists/${uid}/${listId}`] = {
      name: 'Favoritos',
      description: 'Mis lugares favoritos',
      numItems: 0
    };
    
    // Perform a multi-path update
    this.db.database.ref().update(updates);

    // An avatar with the initial letter of the username is created
    this.getUserInitialAvatar(username)
    .subscribe(avatar => this.uploadImage(avatar));
  }

  getUserInitialAvatar(username: string): Observable<Blob> {
    return this.http.get(
      `https://ui-avatars.com/api/?name=${username}&size=120&background=d0d0d0&length=1`,
      { responseType: 'blob' }
    );
  }

  createList(name: string, description: string) {
    this.db.list(`user-lists/${this.uid}`).push({
      name: name,
      description: description,
      numItems: 0
    });
  }

  getList(listId: string) {
    return this.db.list(`lists/${listId}`).snapshotChanges();
  }

  deleteList(listId: string) {
    this.userListsRef.remove(listId);
    this.listsRef.remove(listId);
  }

  addPlaceToList(listId: string, placeId: string, name: string,
    address: string, photoUrl: string): Promise<any> {
    return this.db.object(`lists/${listId}/${placeId}`).set({
      name: name,
      address: address,
      photoUrl: photoUrl
    })
    .then(() => {
      const listRef = this.db.database.ref(`user-lists/${this.uid}/${listId}`);
      return listRef.once('value', snap => {
        return listRef.update({ numItems: ++snap.val().numItems });
      });
    });
  }

  checkIfPlaceBelongsToList(listId: string, placeId: string): Promise<boolean> {
    return this.db.database.ref(`lists/${listId}/${placeId}`).once('value')
    .then(snap => {
      return snap.exists();
    });
  }

  deletePlaceFromList(listId: string, placeId: string) {
    this.db.list(`lists/${listId}`).remove(placeId);
    this.db.database.ref(`user-lists/${this.uid}/${listId}`).once('value', snap => {
      snap.ref.update({ numItems: --snap.val().numItems });
    });
  }

  getUserLists(): Observable<any> {
    return this.userListsRef.snapshotChanges();
  }

  getUserData(): Observable<any> {
    return this.db.object(`users/${this.uid}`).valueChanges();
  }

  uploadImage(data?: Blob, base64Data?: string): Promise<any> {
    let imageRef = firebase.storage().ref().child(`${this.uid}.jpg`);

    if (data) {
      return imageRef.put(data)
      .then(snap => {
        return this.updateProfileImage(snap.downloadURL);
      });
    } else {
      return imageRef.putString(base64Data, 'base64')
      .then(snap => {
        return this.updateProfileImage(snap.downloadURL);
      });
    }
  }

  updateProfileImage(url: string) {
    this.userRef.update({ profile_image: url });
  }
}
