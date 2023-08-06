const express = require('express');
const cors = require('cors');
const pg = require('pg');
require('dotenv').config();
const app = express();
const pool = require('./DB/db.js');

// Middleware
app.use(cors());
app.use(express.json());

// Routes

// Create a user
app.post("/users", async (req, res) => {
    try {
        // console.log(req.body);
        const { name, email, password, phone } = req.body;
        const newUser = await pool.query("INSERT INTO users (name, email, password, phone) VALUES ($1, $2, $3, $4) RETURNING *", [name, email, password, phone]);
        res.json(newUser);

    } catch (error) {
        console.error("Error : ",error.message );
    }
})

// Get all users
app.get("/users", async (req, res) => {
    try {
        const allUsers = await pool.query("SELECT * FROM users");
        res.json(allUsers.rows);
    } catch (error) {
        console.error("Error : ",error.message );
    }
})

// Get a user
app.get("/user", async (req, res) => {
    try {
        const { name } = req.body;
        const user = await pool.query("SELECT * FROM users WHERE name = $1", [name]);
        if (user.rows.length === 0) {
            return res.json("No User Found 😢");
        }else{
            res.json(user.rows[0]);
        }

    } catch (error) {
        res.json(error.message );
    }
})

// Update a user
app.put("/user/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const user = await pool.query("SELECT * FROM users WHERE user_id = $1", [id]);
        let { name, email, password, phone } = user.rows[0]
        if(req.body.name){
            name = req.body.name;
        }
        if(req.body.email){
            email = req.body.email;
        }
        if(req.body.password){
            password = req.body.password;
        }
        if(req.body.phone){
            phone = req.body.phone;
        }
        // const { name, email, password, phone } = req.body;

        const updateUser = await pool.query("UPDATE users SET user_id= $1, name = $2, email = $3, password = $4, phone = $5 WHERE user_id = $1", [id, name, email, password, phone]);
        res.json("User was updated successfully");
    } catch (error) {
        res.json(error.message);
    }
})

// Delete a user
app.delete("/user/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deleteUser = await pool.query("DELETE FROM users WHERE user_id = $1", [id]);
        res.json("User was deleted successfully");
    } catch (error) {
        res.json(error.message);
    }
})



const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}.`);
})