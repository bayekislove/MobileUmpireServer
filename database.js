var pg = require('pg');

var connectionString = 'postgres://postgres:skinsept27@localhost:5432/MobileUmpire';
var client = new pg.Client(connectionString);

const connect = async () => {
    try {
        await client.connect();
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
};

const ifUserExistsByLogin = async (login) => {
    try {
        const res = await client.query(`SELECT * FROM "Users" WHERE "login"='${login}'`);
        return res.rowCount > 0;
    } catch (err) {
        console.log(err);
        return false;
    }
};

const addUser = async (username, password) => {
    try {
        await client.query(`INSERT INTO "Users" (login, password) VALUES ('${username}', '${password}')`);
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
};

const getPasswordByLogin = async (username) => {
    try {
        const user = await client.query(`SELECT * FROM "Users" WHERE ("login"='${username}')`);
        return user.rows[0].password;
    } catch (err) {
        console.log(err);
    }
};

const addMatch = async (info) => {
    try {
        let res = await client.query(`INSERT INTO "Matches" (
            playerAName, playerBName, duration, date, tournamentname, round, result, umpire)
            VALUES ('${info.playerAName}', '${info.playerBName}', '${info.duration}', '${info.date}', 
            '${info.tournamentName}', '${info.round}', '${info.result}', '${info.umpire}')
            RETURNING id`);
        console.log("New match id: " + `${res.rows[0].id}`);
        return res.rows[0].id;
  
    } catch (err) {
        console.log(err);
    }
};

const addStats = async (playerAStats, playerBStats, id) => {
    try {
        for(let i = 0; i < 4; i++) {
            let stats = playerAStats[i];
            console.log(stats);
            let statsStringPlayerA = `${id}, ${i}, ${stats[0]}, ${stats[1]}, ${stats[2]}, ${stats[3]}, ${stats[4]}, ${stats[5]}, ${stats[6]}, true`;
            let queryStringPlayerA = `INSERT INTO "Stats"(
              matchid, set, aces, firstservesin, totalserves, doublefaults, unforcederrors, winners, pointswon, isplayerA)
              VALUES (${statsStringPlayerA})`;
            await client.query(queryStringPlayerA);
  
            stats = playerBStats[i];
            console.log(stats);
            let statsStringPlayerB = `${id}, ${i}, ${stats[0]}, ${stats[1]}, ${stats[2]}, ${stats[3]}, ${stats[4]}, ${stats[5]}, ${stats[6]}, false`;
            let queryStringPlayerB = `INSERT INTO "Stats"(
              matchid, set, aces, firstservesin, totalserves, doublefaults, unforcederrors, winners, pointswon, isplayerA)
              VALUES (${statsStringPlayerB})`;
            await client.query(queryStringPlayerB);
        }
    } catch (err) {
        console.log(err);
    }
}

const getMatchesByUmpire = async (umpire) => {
    try {
        const res = await client.query(`SELECT * FROM "Matches" WHERE ("umpire"='${umpire}')`);
        return res.rows;
    } catch (err) {
        console.log(err);
    }
};

const getStatsByMatchId = async (matchId) => {
    try {
        const res = await client.query(`SELECT * from "Stats" WHERE ("matchid"=${matchId})`);
        let playerAStats = [];
        let playerBStats = [];
        res.rows.forEach(set => {
          if(set.isPlayerA) {
            playerAStats[set.set] = helpers.serializeStatsForPlayer(set);
          } else {
            playerBStats[set.set] = helpers.serializeStatsForPlayer(set);
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

module.exports = {
    connect,
    ifUserExistsByLogin,
    addUser,
    getPasswordByLogin,
    addMatch,
    addStats,
    getMatchesByUmpire,
    getStatsByMatchId,
    deleteMatchById
}