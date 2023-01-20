const express = require("express");

const helpers = require('./helpers');
const db = require('./database');
const auth = require('./auth');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3003;

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
    const token = helpers.getJWT(username);
    res.status(200).json({'token': token});
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

app.post('/matches', auth.auth, async (req, res) => {
  req.body.info.umpire = req.login;
  const id = await db.addMatch(req.body.info);

  await db.addStats(req.body.statsPlayerA, req.body.statsPlayerB, id);
  res.status(200).json({'message': "Match added correctly"});
});

app.get('/matches', auth.auth, async (req, res) => {
  const reqUmpire = req.login;

  const matches = await db.getMatchesByUmpire(reqUmpire);
  res.status(200).json(matches);
});

app.get('/stats/:id/', auth.auth, async (req, res) => {
  const reqMatchId = req.params.id;
  const reqUmpire = req.login;
  console.log(reqMatchId, reqUmpire);
  console.log(await db.ifMatchExistByIdAndUmpire(reqMatchId, reqUmpire));

  if (!await db.ifMatchExistByIdAndUmpire(reqMatchId, reqUmpire)) {
    res.status(401).json("User not authorized to get stats!");
  };

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

app.delete('/matches/:id', auth.auth, async (req, res) => {
  const reqMatchId = req.params.id;
  const reqUmpire = req.login;

  if (!await db.ifMatchExistByIdAndUmpire(reqMatchId, reqUmpire)) {
    res.status(401).json("User not authorized to delete match!");
  };

  await db.deleteMatchById(reqMatchId);
  await db.deleteStatsByMatchId(reqMatchId);

  res.status(200).json({'message': "Match deleted correctly"});
});
