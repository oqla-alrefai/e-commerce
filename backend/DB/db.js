const {Pool} = require("pg")

const pool = new Pool({
    user: "oqla",
    password: "0000",
    host: "localhost",
    port: 5432,
    database: "Store"
})

module.exports = pool;