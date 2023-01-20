var pg = require('pg');

var client = new pg.Client(process.env.connectionString);

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
        const res = await client.query(`SELECT * FROM "Users" WHERE login = $1`, [login]);
        return res.rowCount > 0;
    } catch (err) {
        console.log(err);
        return false;
    }
};

const addUser = async (login, password) => {
    try {
        await client.query(`INSERT INTO "Users" (login, password) VALUES ($1, $2)`,
            [login, password]);
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
};

const getPasswordByLogin = async (login) => {
    try {
        const user = await client.query(`SELECT * FROM "Users" WHERE login = $1`, [login]);
        return user.rows[0].password;
    } catch (err) {
        console.log(err);
    }
};

const addMatch = async (info) => {
    try {
        const valuesFromInfo = [info.playeraname, info.playerbname, info.duration, info.date,
            info.tournamentname, info.round, info.result, info.umpire];
        let res = await client.query(`INSERT INTO "Matches" (
            playeraname, playerbname, duration, date, tournamentname, round, result, umpire)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id`, valuesFromInfo);
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

            let valuesForPlayerA = [id, i, stats[0], stats[1], stats[2], stats[3],
                stats[4], stats[5], stats[6], true];

            let queryStringPlayerA = `INSERT INTO "Stats"(
              matchid, set, aces, firstservesin, totalserves, doublefaults, unforcederrors, winners, pointswon, isplayera)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;

            await client.query(queryStringPlayerA, valuesForPlayerA);
  
            stats = playerBStats[i];

            let valuesForPlayerB = [id, i, stats[0], stats[1], stats[2], stats[3],
                stats[4], stats[5], stats[6], false];

            let queryStringPlayerB = `INSERT INTO "Stats"(
              matchid, set, aces, firstservesin, totalserves, doublefaults, unforcederrors, winners, pointswon, isplayera)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;

            await client.query(queryStringPlayerB, valuesForPlayerB);
        }
    } catch (err) {
        console.log(err);
    }
}

const getMatchesByUmpire = async (umpire) => {
    try {
        const res = await client.query(`SELECT * FROM "Matches" WHERE umpire = $1`, [umpire]);
        return res.rows;
    } catch (err) {
        console.log(err);
    }
};

const getStatsByMatchId = async (matchid) => {
    try {
        const res = await client.query(`SELECT * from "Stats" WHERE matchid = $1`, [matchid]);
        return res.rows;
    } catch (err) {
        console.log(err);
    }
};

const ifMatchExistByIdAndUmpire = async (matchid, umpire) => {
    try {
        const res = await client.query(`SELECT * from "Matches" WHERE id = $1 AND umpire = $2`,
            [matchid, umpire]);
        return res.rowCount > 0;
    } catch (err) {
        console.log(err);
    }
}

const deleteMatchById = async (id) => {
    try {
        await client.query(`DELETE FROM "Matches" WHERE id = $1`, [id]);
    } catch (err) {
        console.log(err);
    }
};

const deleteStatsByMatchId = async (matchid) => {
    try {
        await client.query(`DELETE FROM "Stats" WHERE matchid = $1`, [matchid]);
    } catch (err) {
        console.log(err);
    }
}

module.exports = {
    connect,
    ifUserExistsByLogin,
    addUser,
    getPasswordByLogin,
    addMatch,
    addStats,
    getMatchesByUmpire,
    getStatsByMatchId,
    deleteMatchById,
    deleteStatsByMatchId,
    ifMatchExistByIdAndUmpire
}
