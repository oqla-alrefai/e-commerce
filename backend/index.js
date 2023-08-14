const express = require("express");
const cors = require("cors");
const pg = require("pg");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const pool = require("./DB/db.js");

// Middleware
app.use(cors());
app.use(express.json());

const jwtSecret = "your_jwt_secret_key";

// Routes

app.get("/", (req, res) => {
  res.json("hello world");
});

// Create a user signup
app.post("/users", async (req, res) => {
  try {
    // console.log(req.body);
    const { full_name, email, password } = req.body;
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);

    // Hash the password using the salt
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await pool.query(
      "INSERT INTO users (full_name, email, password) VALUES ($1, $2, $3) RETURNING *",
      [full_name, email, hashedPassword]
    );
    res.json(newUser.rows[0]);
  } catch (error) {
    console.error("Error : ", error.message);
  }
});

// Sign-in route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const client = await pool.connect();
    // Query the database to find the user by email
    const result = await client.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = result.rows[0];
    client.release();
    // If user not found or password does not match, return an error response
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    // Generate a JWT token with the user ID as payload
    const token = jwt.sign({ user_id: user.user_id }, jwtSecret, {
      expiresIn: "1h",
    });

    // Return the token in the response
    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    console.error("Error executing login:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all users
app.get("/users", async (req, res) => {
  try {
    const allUsers = await pool.query("SELECT * FROM users");
    res.json(allUsers.rows);
  } catch (error) {
    console.error("Error : ", error.message);
  }
});

// Get a user by email or id
app.get("/user", async (req, res) => {
  try {
    const { email, user_id } = req.body;
    const user = await pool.query("SELECT * FROM users WHERE email = $1 OR user_id = $2", [
      email,user_id
    ]);
    if (user.rows.length === 0) {
      return res.json("No User Found 😢");
    } else {
      res.json(user.rows[0]);
    }
  } catch (error) {
    res.json(error.message);
  }
});

// get user by id
// app.get("/user", async (req, res) => {
//   try {
//     const { user_id } = req.body;
//     const user = await pool.query("SELECT * FROM users WHERE user_id = $1", [
//       user_id,
//     ]);
//     if (user.rows.length === 0) {
//       return res.json("No User Found 😢");
//     } else {
//       res.json(user.rows[0]);
//     }
//   } catch (error) {
//     res.json(error.message);
//   }
// });

// Update a user
app.put("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await pool.query("SELECT * FROM users WHERE user_id = $1", [
      id,
    ]);
    let { full_name, email, password, image_url, favorite, admin } = user.rows[0];
    if (req.body.full_name) {
      full_name = req.body.full_name;
    }
    if (req.body.email) {
      email = req.body.email;
    }
    if (req.body.password) {
      password = req.body.password;
    }
    if (req.body.image_url) {
      image_url = req.body.image_url;
    }
    if (req.body.favorite) {
      favorite = req.body.favorite;
    }
    

    if (req.body.admin) {
      admin = req.body.admin;
    }

    const updateUser = await pool.query(
      "UPDATE users SET user_id= $1,  email = $2, password = $3, full_name = $4, image_url = $5, favorite=$6, admin = $7 WHERE user_id = $1",
      [id, email, password, full_name, image_url,favorite, admin]
    );
    res.json("User was updated successfully");
  } catch (error) {
    res.json(error.message);
  }
});

// Delete a user
app.delete("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleteUser = await pool.query(
      "DELETE FROM users WHERE user_id = $1",
      [id]
    );
    res.json("User was deleted successfully");
  } catch (error) {
    res.json(error.message);
  }
});

// Get items created by a specific user route
app.get("/users/:user_id/items", async (req, res) => {
  const { user_id } = req.params;

  try {
    const client = await pool.connect();

    // Check if the user exists based on user_id
    const existingUser = await client.query(
      'SELECT * FROM "User" WHERE user_id = $1',
      [user_id]
    );
    if (existingUser.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: "User not found" });
    }

    // Retrieve all items created by the specific user
    const userItems = await client.query(
      'SELECT * FROM "Item" WHERE user_id = $1',
      [user_id]
    );

    client.release();

    res.status(200).json(userItems.rows);
  } catch (err) {
    console.error("Error executing get user items:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get the owner of a specific item route
app.get("/items/:item_id/owner", async (req, res) => {
  const { item_id } = req.params;

  try {
    const client = await pool.connect();

    // Retrieve the item from the database based on item_id
    const item = await client.query('SELECT * FROM "Item" WHERE item_id = $1', [
      item_id,
    ]);
    if (item.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: "Item not found" });
    }

    const user_id = item.rows[0].user_id;

    // Retrieve the owner of the item from the database based on user_id
    const owner = await client.query(
      'SELECT * FROM "User" WHERE user_id = $1',
      [user_id]
    );

    client.release();

    res.status(200).json(owner.rows[0]);
  } catch (err) {
    console.error("Error executing get item owner:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all items route
app.get("/items", async (req, res) => {
  try {
    const client = await pool.connect();

    // Retrieve all items from the database
    const allItems = await client.query("SELECT * FROM Item");

    client.release();

    res.status(200).json(allItems.rows);
  } catch (err) {
    console.error("Error executing get all items:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add new item route
app.post("/items", async (req, res) => {
  let { user_id, name, description, imageUrl, price, categories } = req.body;
  user_id = 19;
  try {
    const client = await pool.connect();

    // Check if the user exists based on user_id
    const existingUser = await client.query(
      "SELECT * FROM users WHERE user_id = $1",
      [user_id]
    );
    if (existingUser.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: "User not found" });
    }

    // Insert the new item into the database
    const newItem = await client.query(
      "INSERT INTO Item (user_id, name, description, image_url, price, categories) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [user_id, name, description, imageUrl, price, categories]
    );

    client.release();

    res.status(201).json(newItem.rows[0]);
  } catch (err) {
    console.error("Error executing add new item:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});
