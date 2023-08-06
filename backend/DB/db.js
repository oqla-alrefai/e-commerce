const {Pool} = require("pg")

const pool = new Pool({
    user: "oqlaalrefai",
    password: "ToniInter23",
    host: "localhost",
    port: 5432,
    database: "store"
})

module.exports = pool;