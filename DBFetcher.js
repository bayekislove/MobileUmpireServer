var pg = require('pg');

const CONNECTION_STRING = "postgres://postgres:skinsept27@localhost:5432/MobileUmpire";

class DBFetcher {
    #client = pg.Client(connectionString);

    constructor() {

    }

    connect = async () => {
        try {
            await this.#client.connect();
        } catch (err) {
            console.log(err);
        }
    }


}

module.exports = DBFetcher;