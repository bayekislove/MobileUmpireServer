const express = require("express");
const bcrypt = require("bcrypt");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 8080;
const MIN_SALT_ROUNDS = 5;
const MAX_SALT_ROUNDS = 13;

var pg = require('pg');

var client = new pg.Client(process.env.connectionString);

const getRandomIntInclusive = (min, max) => {
  //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const setupDB = async () => {
  try {
    await client.connect();
  } catch (err) {
    console.log(err);
  }
};

const uniqueLoginNotExists = async (username) => {
  try {
    const res = await client.query(`SELECT * FROM "Users" WHERE "login"='${username}'`);
    return res.rowCount == 0;
  } catch (err) {
    console.log(err);
  }
};

const addUser = async (username, password) => {
  try {
    let saltRounds = getRandomIntInclusive(MIN_SALT_ROUNDS, MAX_SALT_ROUNDS);
    let hashedPassword = "";

    await bcrypt.hash(password, saltRounds)
    .then(hash => {
      console.log('Hash: ', hash);
      hashedPassword = hash;
    })
    .catch(err => console.error(err.message));

    await client.query(`INSERT INTO "Users" (login, password) VALUES ('${username}', '${hashedPassword}')`);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

const ifCredentialsCorrect = async (username, password) => {
  try {
    const userCredentials = await client.query(`SELECT * FROM "Users" WHERE ("login"='${username}')`);
    const hashedPasswordFromDb = userCredentials.rows[0].password;

    return await bcrypt
      .compare(password, hashedPasswordFromDb)
      .catch(err => console.error(err.message)) 
  } catch (err) {
    console.log(err);
  }
};

const saveMatchInfo = async (info) => {
  try {

    let res = await client.query(`INSERT INTO "Matches"(
      "playerAName", "playerBName", duration, date, "tournamentName", round, result, umpire)
      VALUES ('${info.playerAName}', '${info.playerBName}', '${info.duration}', '${info.date}', 
      '${info.tournamentName}', '${info.round}', '${info.result}', '${info.umpire}')
      RETURNING id`);
    console.log("New match id: " + `${res.rows[0].id}`);
    return res.rows[0].id;

  } catch (err) {
    console.log(err);
  }
};

const saveSetsStats = async (playerAStats, playerBStats, id) => {
  try {
    for(let i = 0; i < 4; i++) {
      let stats = playerAStats[i];
      console.log(stats);
      let statsStringPlayerA = `${id}, ${i}, ${stats[0]}, ${stats[1]}, ${stats[2]}, ${stats[3]}, ${stats[4]}, ${stats[5]}, ${stats[6]}, true`;
      let queryStringPlayerA = `INSERT INTO "Stats"(
        matchid, set, aces, firstservesin, totalserves, doublefaults, unforcederrors, winners, pointswon, "isPlayerA")
        VALUES (${statsStringPlayerA})`;
      await client.query(queryStringPlayerA);

      stats = playerBStats[i];
      console.log(stats);
      let statsStringPlayerB = `${id}, ${i}, ${stats[0]}, ${stats[1]}, ${stats[2]}, ${stats[3]}, ${stats[4]}, ${stats[5]}, ${stats[6]}, false`;
      let queryStringPlayerB = `INSERT INTO "Stats"(
        matchid, set, aces, firstservesin, totalserves, doublefaults, unforcederrors, winners, pointswon, "isPlayerA")
        VALUES (${statsStringPlayerB})`;
      await client.query(queryStringPlayerB);
    }
  } catch (err) {
    console.log(err);
  }
}

const getMatchesForPlayer = async (umpire) => {
  try {
    const res = await client.query(`SELECT * FROM "Matches" WHERE ("umpire"='${umpire}')`);
    return res.rows;
  } catch (err) {
    console.log(err);
  }
};

const serializeStatsForPlayer = (stats) => {
  return [stats.aces, stats.firstservesin, stats.totalserves, stats.doublefaults, stats.unforcederrors, stats.winners, stats.pointswon];
}

const getStatsByMatchId = async (matchId) => {
  try {
    const res = await client.query(`SELECT * from "Stats" WHERE ("matchid"=${matchId})`);
    let playerAStats = [];
    let playerBStats = [];
    res.rows.forEach(set => {
      if(set.isPlayerA) {
        playerAStats[set.set] = serializeStatsForPlayer(set);
      } else {
        playerBStats[set.set] = serializeStatsForPlayer(set);
      }
    });
    return [playerAStats, playerBStats];
  } catch (err) {
    console.log(err);
  }
};

const deleteMatchById = async (matchId) => {
  try {
    await client.query(`DELETE FROM "Matches" WHERE ("id"=${matchId})`);
    await client.query(`DELETE FROM "Stats" WHERE ("matchid"=${matchId})`);
  } catch (err) {
    console.log(err);
  }
};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
  setupDB();
  console.log('Db connection succeeded');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const correctCredentials = await ifCredentialsCorrect(username, password);
  if(correctCredentials) {
    res.status(200).json("git");
  } else {
    res.status(401).json("nie git");
  }
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  console.log(username, password);
  const ifUserIsRegistered = await uniqueLoginNotExists(username);
  console.log(ifUserIsRegistered);
  if(ifUserIsRegistered) {
    res.status(401).json("nie git");
  }

  const ifUserAdded = await addUser(username, password);
  if(ifUserAdded) {
    res.status(200).json("git");
  } else {
    res.status(401).json("nie git");
  };
});

app.post('/matches', async (req, res) => {
  let id = await saveMatchInfo(req.body.info);
  await saveSetsStats(req.body.statsPlayerA, req.body.statsPlayerB, id);
  res.status(200).json("git");
});

app.get('/matches/:umpire', async (req, res) => {
  let reqUmpire = req.params.umpire;
  let matches = await getMatchesForPlayer(reqUmpire);
  res.status(200).json(matches);
});

app.get('/stats/:id/', async (req, res) => {
  let reqMatch = req.params.id;
  let stats = await getStatsByMatchId(reqMatch);
  //console.log(stats);
  res.status(200).json(stats);
});

app.delete('/matches/:id', async (req, res) => {
  let reqMatch = req.params.id;
  await deleteMatchById(reqMatch);
  res.status(200).json("git");
});
