var spicedPg = require("spiced-pg");

let db;
if (process.env.DATABASE_URL) {
    db = spicedPg(process.env.DATABASE_URL);
} else {
    db = spicedPg("postgres:postgres:postgres@localhost:5432/signatures");
}

exports.addSignature = function addSignature(user_id, signature) {
    return db.query(
        `INSERT INTO signatures (user_id, signature) VALUES($1, $2) RETURNING id`,
        [user_id, signature]
    );
};
exports.addUser = function addUser(first, last, email, password) {
    return db.query(
        `INSERT INTO users (first, last, email, password) VALUES($1, $2, $3, $4) RETURNING id`,
        [first, last, email, password]
    );
};

exports.getNumOfSigners = function getNumOfSigners() {
    return db.query("SELECT COUNT(*) FROM signatures");
};

// exports.getUsers = function getUsers() {
//     return db.query("SELECT * FROM signatures");
// };

exports.getSigImg = function getSigImg(id) {
    return db.query(`SELECT signature FROM signatures WHERE id = ${id}`);
};
exports.getEmail = function getEmail(email) {
    return db.query(
        `SELECT users.id AS id, signatures.id AS sigId, users.password AS password
FROM users
LEFT OUTER JOIN signatures
ON users.id = signatures.user_id
WHERE email = ($1)`,
        [email]
    );
};

exports.addInfo = function addInfo(age, city, url, user_id) {
    return db.query(
        `INSERT INTO user_profiles(age, city, url, user_id)VALUES($1, $2, $3, $4)`,
        [age, city, url, user_id]
    );
};

exports.getUsers = function getUsers() {
    return db.query(`SELECT users.first AS first, users.last AS last, users.id AS user_id, user_profiles.age AS age, user_profiles.city AS city, user_profiles.url AS url
    FROM signatures
    INNER JOIN users
    ON signatures.user_id = users.id
    LEFT OUTER JOIN user_profiles
    ON signatures.user_id = user_profiles.user_id`);
};
exports.getUsersByCity = function getUsersByCity(city) {
    return db.query(
        `SELECT users.first AS first, users.last AS last, users.id AS user_id, user_profiles.age AS age, user_profiles.city AS city, user_profiles.url AS url FROM signatures
    FULL OUTER JOIN users
    ON signatures.user_id = users.id
    FULL OUTER JOIN user_profiles
    ON signatures.user_id = user_profiles.user_id
    WHERE LOWER(city) = LOWER($1)`,
        [city]
    );
};
exports.updateProfile = function updateProfile(user_id, age, city, url) {
    return db.query(
        `INSERT INTO user_profiles (user_id, age, city, url)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id)
    DO UPDATE SET age = $2, city = $3, url = $4`,
        [user_id, age, city, url]
    );
};

exports.updateProfileNoPassword = function updateProfileNoPassword(
    first,
    last,
    email,
    id
) {
    return db.query(
        `UPDATE users
            SET first = ($1), last = ($2), email = ($3)
            WHERE id = ($4)`,
        [first, last, email, id]
    );
};

exports.updateProfileAndPassword = function updateProfileAndPassword(
    first,
    last,
    email,
    password,
    userId
) {
    return db.query(
        `UPDATE users
                SET first = ($1), last = ($2), email = ($3), password = ($4)
                WHERE id = ($5)`,
        [first, last, email, password, userId]
    );
};

exports.deleteSig = function deleteSig(user_id) {
    return db.query(`DELETE FROM signatures WHERE user_id = ($1)`, [user_id]);
};
