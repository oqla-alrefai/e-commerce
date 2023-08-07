CREATE TABLE Item (
  item_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES "User"(user_id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url VARCHAR(255) DEFAULT NULL,
  price NUMERIC(10, 2) NOT NULL
);