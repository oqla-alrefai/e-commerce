const {Pool} = require("pg")

const pool = new Pool({
    user: process.env.USER || "oqla",
    password: process.env.PASSWORD || "0000",
    host: process.env.HOST ||"localhost",
    port: process.env.PORT || 5432,
    database: process.env.DATABASE || "Store"
})

module.exports = pool;