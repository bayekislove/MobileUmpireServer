const express = require("express");
const helpers = require('./helpers');
const db = require('./database');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 8080;

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);

  if(db.connect()) {
    console.log('Db connection set up correctly');
  } else {
    console.error('Db connection gone wrong!');
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const ifUserRegistered = await db.ifUserExistsByLogin(username);
  if(!ifUserRegistered) {
    res.status(401).json("User not registered");
  }

  const hashedPassword = await db.getPasswordByLogin(username);
  if(helpers.comparePasswords(password, hashedPassword)) {
    res.status(200).json("User logged correctly");
  } else {
    res.status(401).json("Wrong credentials");
  }
});

app.post('/register', async (req, res) => {

  const { username, password } = req.body;

  const ifUserRegistered = await db.ifUserExistsByLogin(username);
  if(ifUserRegistered) {
    res.status(403).json("User is already registered!");
  }

  const hashedPassword = helpers.getHashedPassword(password);
  const ifUserAdded = await db.addUser(username, hashedPassword);
  if(ifUserAdded) {
    console.log("user added");
    res.status(200).json("User registered correctly");
  } else {
    res.status(401).json("Failed while adding user to database");
  };
});

app.post('/matches', async (req, res) => {
  const id = await db.addMatch(req.body.info);

  await db.addStats(req.body.statsPlayerA, req.body.statsPlayerB, id);
  res.status(200).json("Match added correctly");
});

app.get('/matches/:umpire', async (req, res) => {
  const reqUmpire = req.params.umpire;

  const matches = await db.getMatchesByUmpire(reqUmpire);
  res.status(200).json(matches);
});

app.get('/stats/:id/', async (req, res) => {
  const reqMatchId = req.params.id;

  const stats = await db.getStatsByMatchId(reqMatchId);
  res.status(200).json(stats);
});

app.delete('/matches/:id', async (req, res) => {
  const reqMatchId = req.params.id;

  await db.deleteMatchById(reqMatchId);
  res.status(200).json("Match deleted correctly");
});
