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
  console.log(username, password);

  const ifUserRegistered = await db.ifUserExistsByLogin(username);
  if(!ifUserRegistered) {
    res.status(401).json({'message': "User not registered"});
  }

  const hashedPassword = await db.getPasswordByLogin(username);
  if(await helpers.comparePasswords(password, hashedPassword)) {
    res.status(200).json({'message': "User logged correctly"});
  } else {
    res.status(401).json({'message': 'Wrong credentials'});
  }
});

app.post('/register', async (req, res) => {

  const { username, password } = req.body;

  const ifUserRegistered = await db.ifUserExistsByLogin(username);
  if(ifUserRegistered) {
    res.status(403).json({'message':"User is already registered!"});
  }

  const hashedPassword = await helpers.getHashedPassword(password);
  const ifUserAdded = await db.addUser(username, hashedPassword);
  if(ifUserAdded) {
    console.log("user added");
    res.status(200).json({'message': "User registered correctly"});
  } else {
    res.status(401).json({'message': "Failed while adding user to database"});
  };
});

app.post('/matches', async (req, res) => {
  const id = await db.addMatch(req.body.info);

  await db.addStats(req.body.statsPlayerA, req.body.statsPlayerB, id);
  res.status(200).json({'message': "Match added correctly"});
});

app.get('/matches/:umpire', async (req, res) => {
  const reqUmpire = req.params.umpire;

  const matches = await db.getMatchesByUmpire(reqUmpire);
  console.log(matches);
  res.status(200).json(matches);
});

app.get('/stats/:id/', async (req, res) => {
  const reqMatchId = req.params.id;

  const stats = await db.getStatsByMatchId(reqMatchId);

  let playerAStats = [];
  let playerBStats = [];

  stats.forEach(set => {
    if(set.isplayera) {
      playerAStats[set.set] = helpers.serializeStatsForPlayer(set);
    } else {
      playerBStats[set.set] = helpers.serializeStatsForPlayer(set);
    }
  });

  console.log([playerAStats, playerBStats]);
  res.status(200).json([playerAStats, playerBStats]);
});

app.delete('/matches/:id', async (req, res) => {
  const reqMatchId = req.params.id;

  await db.deleteMatchById(reqMatchId);
  res.status(200).json({'message': "Match deleted correctly"});
});
