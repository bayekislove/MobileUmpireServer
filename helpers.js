const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const MIN_SALT_ROUNDS = 5;
const MAX_SALT_ROUNDS = 13;

const ifPasswordHasNumber = (password) => {
    return /[0-9]/.test(password);
};

const validatePassword = (password) => {
    return password.length > 8 &&
        password.toLowerCase() != password &&
        ifPasswordHasNumber(password);
};

//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
const getRandomIntInclusive = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
}

const serializeStatsForPlayer = (stats) => {
    return [stats.aces, stats.firstservesin, stats.totalserves, stats.doublefaults, stats.unforcederrors, stats.winners, stats.pointswon];
}

const getHashedPassword = async (password) => {
    const saltRounds = getRandomIntInclusive(MIN_SALT_ROUNDS, MAX_SALT_ROUNDS);
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
};

const getJWT = (login) => {
    return jwt.sign(
        { user: login },
        process.env.jwtSecret,
        {
          expiresIn: "24h",
        }
    );
};

const getUserFromJWT = (token) => {
    console.log(jwt.verify(token, process.env.jwtSecret).user);
    return jwt.verify(token, process.env.jwtSecret).user;
};

module.exports = {
    ifPasswordHasNumber,
    validatePassword,
    getRandomIntInclusive,
    serializeStatsForPlayer,
    getHashedPassword,
    comparePasswords,
    getJWT,
    getUserFromJWT
}
