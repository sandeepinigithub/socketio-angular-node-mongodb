let express = require('express');
let cors = require('cors');
let bodyParser = require('body-parser')
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http, {
  cors: {
    origins: [
      "http://localhost:3000",
      "http://localhost:4200",
      "http://localhost:8080",
      "http://192.168.0.181:4200",
      "http:192.168.0.181:3000",
      "http:192.168.0.181"
    ],
  },
});
let mongoose = require('mongoose');
// CORS is enabled for the selected origins
let corsOptions = {
  origin: ['http://localhost:4200', 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://192.168.0.181:4200', 'http:192.168.0.181:3000', 'http:192.168.0.181'],
  methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH']
};

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors(corsOptions))

let Message = mongoose.model('Message', {
  name: String,
  message: String,
  groupId: String
})

// let dbUrl = 'mongodb://localhost:27017/simple-chat'
let dbUrl = 'mongodb+srv://sandeep:sandeep@cluster0.1wvol.mongodb.net/np-chat'

io.use((socket, next) => {
  let token = socket.handshake.auth.token;
  console.log('token', token);
  chatGroupId = socket.handshake.auth.groupId;
  next();
});

app.get('/messages', (req, res) => {
  Message.find({}, (err, messages) => {
    res.send(messages);
  })
})


app.get('/messages/:groupId', (req, res) => {
  let groupId = req.params.groupId
  Message.find({ groupId: groupId }, (err, messages) => {
    res.send(messages);
  })
})


app.post('/messages', async (req, res) => {
  try {
    let message = new Message(req.body);
    let savedMessage = await message.save()
    console.log('saved');
    let censored = await Message.findOne({ message: 'badword' });
    if (censored)
      await Message.remove({ _id: censored.id })
    else
      io.emit('message', req.body);
    res.sendStatus(200);
  }
  catch (error) {
    res.sendStatus(500);
    return console.log('error', error);
  }
  finally {
    console.log('Message Posted')
  }

})



// io.on('connection', () => {
//   console.log('user is connected -- socketio')
// })

io.on('connection', (socket) => {
  console.log('user is connected -- socketio')
  socket.on('sendMsg', async (msg) => {
    // ++++++ Our Logic for saving in DB +++++
    // io.emit('my broadcast', `server: ${msg}`);
    try {
      let temp = {
        ...msg,
        groupId: msg.groupId
      }
      let message = new Message(temp);
      let msgId = `message${msg.groupId}`;
      let savedMessage = await message.save()
      console.log('saved');
      let censored = await Message.findOne({ message: 'badword' });
      // +++++++++ Return Message via group +++++++++
      if (censored)
        await Message.remove({ _id: censored.id })
      else {
        let data = await Message.find({ groupId: msg.groupId });
        io.emit(`${msgId}`, data);
      }
    }
    catch (error) {
      return console.log('error', error);
    }
    finally {
      console.log('Message Posted')
    }
  });
  socket.on('deleteMsg', async (msg) => {
    // ++++++ Our Logic for saving in DB +++++
    // io.emit('my broadcast', `server: ${msg}`);
    try {
      let emitId = `message${msg.groupId}`;
      let deleteId = msg._id;
      debugger;
      let deleteMsgRes = await Message.deleteOne({ _id: deleteId });
      debugger;
      let data = await Message.find({ groupId: msg.groupId });
      io.emit(`${emitId}`, data);
    } catch (error) {
      return console.log('error', error);
    }
    finally {
      console.log('Message Deleted')
    }
  });
});

mongoose.connect(dbUrl, { useUnifiedTopology: true, useNewUrlParser: true }, (err) => {
  console.log('mongodb connected', err);
})

let server = http.listen(3000, '192.168.0.181', () => {
  console.log('server is running on port', server.address().port);
});
