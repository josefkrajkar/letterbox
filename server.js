const express = require('express');
const app = express();
const { createServer } = require('http');
const server = createServer(express);
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
const bodyParser = require('body-parser');
const rooms = [];
const {parse} = require('url');
const clients = [];
const UUID = require('uuid');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server })
const wsPort = 6969;

wss.on('connection', function connection(ws, req) {

  const params = parse(req.url, true);

  const roomIndex = rooms.findIndex(room => room.id === params.query.uuid);
  if (roomIndex > -1) {
    clients.push({
      id: rooms[roomIndex].id,
      ws
    });
  }

  ws.on('message', function incoming(data) {
    const msgParams = parse(req.url, true);
    const roomIndex = rooms.findIndex(room => room.id === msgParams.query.uuid);
    if (roomIndex > -1) {
      const arrayOfClients = clients.filter(client => client.id === msgParams.query.uuid && (client.ws !== ws && client.ws.readyState === WebSocket.OPEN));
      arrayOfClients.forEach(client => {
        client.ws.send(data);
      });
    }
  });
});

server.listen(wsPort, function() {
  console.log(`> Websocket ready on ws://localhost:${wsPort}`)
});

app.use(express.static("front-end"));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.post('/api/createRoom', (req, res) => {
  const uuid = UUID.v4();
  rooms.push({
    id: uuid,
    name: req.body.name,
    pass: req.body.pass
  });
  res.status(200);
  res.json({uuid});
});

app.post('/api/enterRoom', (req, res) => {
  const roomIndex = rooms.findIndex(item => item.name === req.body.name);
  if (roomIndex > -1 && req.body.pass === rooms[roomIndex].pass) {
    res.status(200);
    res.json({uuid: rooms[roomIndex].id});
  } else {
    res.status(404);
    res.send('KO');
  }
});

app.listen(port, () => {
  console.log(`> App listening at http://localhost:${port}`);
});
