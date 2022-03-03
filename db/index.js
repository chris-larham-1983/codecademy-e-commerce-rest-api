const { Pool, Client } = require('pg');

const devConfig = {
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    port: process.env.PG_PORT,
};

const proConfig = {
    connectionString: process.env.DATABASE_URL + '?sslmode=require'
}

const pool = new Pool(process.env.NODE_ENV === "production"? proConfig: devConfig);

const client = new Client(process.env.NODE_ENV === "production"? proConfig: devConfig);

module.exports = {
    query: (text, params, callback) => {
        const start = Date.now();
        return pool.query(text, params, (err, res) => {
            const duration = Date.now() - start;
            /* The following lines helped me to understand what was going on in the example code:
            console.log('executed query', { text, duration }); //rows: res.rowCount
            console.log('Number of clients existing in the pool: ' + pool.totalCount);
            console.log('Number of clients that are not checked out but are currently idle in the pool: ' + pool.idleCount);
            console.log('Number of queued requests waiting on a client when all clients are checked out. It can be helpful to monitor this number to see if you need to adjust the size of the pool: ' + pool.waitingCount);
            */
            callback(err, res);
        });
    },
    //the following code was included in the example code that I used to get this project working, but I do not currently make use of it [23.02.22]:
    getClient: (callback) => {
        pool.connect((err, client, done) => {
            const query = client.query;

            client.query = (...args) => {
                client.lastQuery = args;
                return query.apply(client, args);
            }

            const timeout = setTimeout(() => {
                console.error('A client has been checked out for more than 5 seconds!');
                console.error(`The last executed query on this client was ${client.lastQuery}`);
            }, 5000);

            const release = (err) => {
                done(err);
                clearTimeout(timeout);
                client.query = query;
            }

            callback(err, client, release);
        });
    }
};