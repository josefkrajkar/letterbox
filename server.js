const express = require('express');
const cors = require('cors');
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3001;
};
const rooms = [];
const clients = [];
const UUID = require('uuid');
const bodyParser = require('body-parser');
const {parse} = require('url');

const server = express()

  .use(bodyParser.urlencoded({extended: false}))
  .use(bodyParser.json())
  .use(cors())

  .post('/api/createRoom', cors(), (req, res) => {
    console.log('creating room', req.body.name);
    const uuid = UUID.v4();
    rooms.push({
      id: uuid,
      name: req.body.name,
      pass: req.body.pass
    });
    res.status(200);
    res.json({uuid});
  })

  .post('/api/enterRoom', cors(), (req, res) => {
    console.log('entering room', req.body.name);
    const roomIndex = rooms.findIndex(item => item.name === req.body.name);
    if (roomIndex > -1 && req.body.pass === rooms[roomIndex].pass) {
      res.status(200);
      res.json({uuid: rooms[roomIndex].id});
    } else {
      res.status(404);
      res.send('KO');
    }
  })

  .get('/ping', cors(), (req, res) => {
    res.status(200);
    res.send('pong');
  })

  .listen(port, () => {
    console.log(`> App listening at http://localhost:${port}`);
  });

const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws, req) {

  const params = parse(req.url, true);

  const roomIndex = rooms.findIndex(room => room.id === params.query.uuid);
  if (roomIndex > -1) {
    clients.push({
      id: rooms[roomIndex].id,
      ws
    });
  }

  // ws.on('close', () => console.log('Client disconnected'));

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