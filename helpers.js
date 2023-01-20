const bcrypt = require("bcrypt");

const getRandomIntInclusive = (min, max) => {
    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
}

const serializeStatsForPlayer = (stats) => {
    return [stats.aces, stats.firstservesin, stats.totalserves, stats.doublefaults, stats.unforcederrors, stats.winners, stats.pointswon];
}

const getHashedPassword = async (password) => {
    const saltRounds = helpers.getRandomIntInclusive(MIN_SALT_ROUNDS, MAX_SALT_ROUNDS);
    const hashedPassword = "";

    await bcrypt.hash(password, saltRounds)
    .then(hash => {
      console.log('Hash: ', hash);
      hashedPassword = hash;
    })
    .catch(err => console.error(err.message));

    return hashedPassword;
};

const comparePasswords = async (password, hashedPassword) => {
    return await bcrypt
        .compare(password, hashedPassword)
        .catch(err => console.error(err.message));
}

module.exports = {
    getRandomIntInclusive,
    serializeStatsForPlayer,
    getHashedPassword,
    comparePasswords
}