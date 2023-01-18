import { Component, OnInit } from '@angular/core';
import { ChatService } from '../services/chat.service';
import { io } from 'socket.io-client';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  usrName: any = '';
  usrMsg: any = '';

  msgList: any = []
  socket:any;

  constructor(private _chatService: ChatService) { }

  ngOnInit(): void {
    this.getMsg();
    this.setupSocketConnection();
  }

  sendMsgBtn() {
    let reqMsg: any = {
      name: this.usrName, message: this.usrMsg
    };
    // this._chatService.sendMsg(reqMsg).subscribe((res: any) => {
    //   console.log("Msg Has been send");
    // });
    this.socket.emit('sendMsg', reqMsg);
  }
  getMsg() {
    this._chatService.getMsg().subscribe((res: any) => {
      console.log("Msg has been received on First Time Call");
      this.msgList = res;
    })
  }

  // ++++++++++++ Socket Connection ++++++++ 
  setupSocketConnection() {
    this.socket = io("ws://192.168.0.181:3000", {
      auth: {
        token: "abc"
      }
    });

    // this.socket.emit('my message', "My Name is Sandeep");
    this.socket.on('message', (res: any) => {
      this.msgList.push(res);
    });
  }

}
