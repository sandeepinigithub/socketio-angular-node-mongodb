import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor(private _http: HttpClient) { }

  sendMsg(reqMsg: any) {
    return this._http.post<any>('http://localhost:3000/messages', reqMsg);
  }
  getMsg() {
    return this._http.get<any>('http://localhost:3000/messages');
  }
}
