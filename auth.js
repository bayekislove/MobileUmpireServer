const helpers = require('./helpers');

const auth = (req, res, next) => {
    const token = req.headers["authorization"].split(" ")[1];;
    console.log("TOKEN: " + token);

    if(!token) {
        return res.status(403).send("No valid token");
    }

    try {
        const login = helpers.getUserFromJWT(token);
        console.log("LOGIN: " + login);
        req.login = login;
    } catch (err) {
        console.log(err);
        return res.status(403).send("No valid token");
    };

    return next();
};

module.exports = {
    auth
}
