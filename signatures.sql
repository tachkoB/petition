DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures(
    id SERIAL PRIMARY KEY,
    user_id INT,
    signature TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
