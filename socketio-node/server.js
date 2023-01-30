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



const cassandra = require("cassandra-driver");
const authProvider = new cassandra.auth.PlainTextAuthProvider(
  "Username",
  "Password"
);
let client = new cassandra.Client({
  contactPoints: ["localhost"],
  keyspace: "meity_chat",
  localDataCenter: "datacenter1",
});

client.on('log', function (level, className, message, furtherInfo) {
  console.log('log event: %s -- %s', level, message);
});

client.connect().then(() => console.log('Cassandra DB Connected!'));


// CORS is enabled for the selected origins
let corsOptions = {
  origin: ['http://localhost:4200', 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://192.168.0.181:4200', 'http:192.168.0.181:3000', 'http:192.168.0.181'],
  methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH']
};

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors(corsOptions))


io.use((socket, next) => {
  let token = socket.handshake.auth.token;
  console.log('token', token);
  chatGroupId = socket.handshake.auth.groupId;
  next();
});

app.get('/messages', async (req, res) => {
  let qResult;
  await client.execute('SELECT id, group_id, message, name FROM  messages', async (error, result) => {
    if (error != undefined) {
      console.log("Error:", error);
    } else {
      qResult = await result.rows;
      res.send(qResult);
      console.table(result.rows);
    }
  });
})


app.get('/messages/:groupId', async (req, res) => {
  let groupId = req.params.groupId
  let qResult;
  await client.execute(`SELECT id, group_id, message, name FROM  messages WHERE group_id = '${groupId}' ALLOW FILTERING`, async (error, result) => {
    if (error != undefined) {
      console.log("Error:", error);
    } else {
      qResult = await result.rows;
      res.send(qResult);
      console.table(result.rows);
    }
  });
})


app.post('/messages', async (req, res) => {
  try {
    let message = req.body;
    let qResult;
    await client.execute(`INSERT INTO messages (id, group_id, message, name) VALUES (${message.id},${message.group_id},${message.message},${message.name})`, async (error, result) => {
      if (error != undefined) {
        console.log("Error:", error);
      } else {
        console.log('saved');
        io.emit('message', req.body);
        res.sendStatus(200);
      }
    });
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

      let message = msg;
      let qResult;
      await client.execute(`INSERT INTO messages (id, group_id, message, name) VALUES (${message.id},'${message.group_id}','${message.message}','${message.name}')`, async (error, result) => {
        if (error != undefined) {
          console.log("Error:", error);
        } else {
          console.log('saved');
          let data = await client.execute(`SELECT id, group_id, message, name FROM  messages WHERE group_id = '${message.group_id}' ALLOW FILTERING`, async (error, result) => {
            if (error != undefined) {
              console.log("Error:", error);
            } else {
              console.log('saved');
              io.emit(`message${msg.group_id}`, result.rows);
            }
          });
        }
      });
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
      let emitId = `message${msg.group_id}`;
      let deleteMsgRes = await await client.execute(`DELETE FROM messages WHERE id = ${msg.id}`, async (error, result) => {
        if (error != undefined) {
          console.log("Error:", error);
        } else {
          console.log('Deleted');
          await client.execute(`SELECT id, group_id, message, name FROM  messages WHERE group_id = '${msg.group_id}' ALLOW FILTERING`, async (error, result) => {
            if (error != undefined) {
              console.log("Error:", error);
            } else {
              console.log('saved');
              io.emit(`${emitId}`, result.rows);
            }
          });
        }
      });

    } catch (error) {
      return console.log('error', error);
    }
    finally {
      console.log('Message Deleted')
    }
  });
});


let server = http.listen(3000, '192.168.0.181', () => {
  console.log('server is running on port', server.address().port);
});
