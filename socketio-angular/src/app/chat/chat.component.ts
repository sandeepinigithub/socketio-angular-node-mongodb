import { Component, OnInit } from '@angular/core';
import { ChatService } from '../services/chat.service';
import { io } from 'socket.io-client';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  usrName: any = '';
  usrMsg: any = '';
  grpId: any = '';
  usrId:any = -1;

  msgList: any = []
  socket: any;

  constructor(private _chatService: ChatService, private _activatedRoute: ActivatedRoute) {
    this.grpId = this._activatedRoute.snapshot.params['id'];
  }

  ngOnInit(): void {
    // this.getMsg();
    this.getMsgByGroupId();
    this.setupSocketConnection();
  }

  sendMsgBtn() {
    let reqMsg: any = {
      name: this.usrName, message: this.usrMsg, group_id: this.grpId,id:Number(this.usrId)
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
  getMsgByGroupId() {
    this._chatService.getMsgById(this.grpId).subscribe((res: any) => {
      console.log("Msg has been received on First Time Call");
      this.msgList = res;
    })
  }

  // ++++++++++++ Socket Connection ++++++++ 
  setupSocketConnection() {
    this.socket = io("ws://192.168.0.181:3000", {
      auth: {
        token: "abc",
        groupId: this.grpId
      }
    });

    // this.socket.emit('my message', "My Name is Sandeep");
    let msgId = `message${this.grpId}`
    this.socket.on(msgId, (res: any) => {
      this.msgList = res;
    });
  }
  deleteMsg(deleteMsgId:any){
    debugger
    this.socket.emit('deleteMsg', deleteMsgId);
  }

}
