const express = require("express");
const app = (exports.app = express());
const hb = require("express-handlebars");
const db = require("./utils/db");
const bc = require("./utils/bc");
const bodyParser = require("body-parser");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const bcrypt = require("bcryptjs");
const helmet = require("helmet");

let secrets;
if (process.env.PORT) {
    secrets = process.env;
} else {
    secrets = require("./secrets.json");
}
app.use(
    cookieSession({
        secret: secrets.cookieSessionSecret,
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);

app.use(bodyParser.urlencoded({ extended: false }));

app.use(helmet());
app.use(csurf());

app.use(function(req, res, next) {
    res.set("x-frame-options", "deny");
    next();
});

app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});
// app.use((req, res, next) => {
//     if (!req.session.userId && req.url != "/register" && req.url != "/login") {
//         res.redirect("/register");
//     } else {
//         next();
//     }
// });

app.use(express.static("./public"));
app.use(express.static("./static"));

// function requireLoggedOut(req, res, next) {
//     if (req.session.userId) {
//         return res.redirect("/welcome");
//     }
//     next();
// }
//
// function requireSigned(req, res, next) {
//     if (!req.session.sigId) {
//         return res.redirect("/welcome");
//     }
//     next();
// }
// function requireNotSigned(req, res, next) {
//     if (req.session.sigId) {
//         return res.redirect("/thank-you");
//     }
//     next();
// }

app.get("/", (req, res) => {
    if (req.session.sigId) {
        res.redirect("/thank-you");
    } else if (req.session.userId) {
        res.redirect("/welcome");
    } else {
        res.redirect("/register");
    }
});

app.get("/register", (req, res) => {
    if (req.session.sigId) {
        res.redirect("/thank-you");
    } else if (req.session.userId) {
        res.redirect("/welcome");
    } else {
        res.render("registration", {
            title: "Registration"
        });
    }
});

app.post("/register", (req, res) => {
    console.log("req body", req.body);
    if (req.body.firstName && req.body.lastName && req.body.email) {
        let hash = bc
            .hashPassword(req.body.password)
            .then(hash => {
                console.log("hash: ", hash);
                return db
                    .addUser(
                        req.body.firstName,
                        req.body.lastName,
                        req.body.email,
                        hash
                    )
                    .then(results => {
                        console.log("Results.rows: ", results.rows);
                        req.session.userId = results.rows[0].id;
                    })
                    .then(() => {
                        console.log("redirecting to profile");
                        res.redirect("/profile");
                    });
            })
            .catch(err => {
                console.log("error", err.message);
            });
    }
});

app.get("/profile", (req, res) => {
    res.render("profile", {
        title: "Fill in information about yourself",
        loggedin: true
    });
});

app.post("/profile", (req, res) => {
    let url = req.body.url;
    if (url && (!url.startsWith("http://") || !url.startsWith("https://"))) {
        url = "http://" + url;
    }

    db.addInfo(
        req.body.age || null,
        req.body.city || null,
        req.body.website || null,
        req.session.userId
    ).then(() => {
        res.redirect("/welcome");
    });
});

app.get("/login", (req, res) => {
    if (req.session.sigId) {
        res.redirect("/thank-you");
    } else if (req.session.userId) {
        res.redirect("/welcome");
    } else {
        res.render("login", {
            title: "Log in"
        });
    }
});
app.post("/login", (req, res) => {
    db.getEmail(req.body.email)
        .then(results => {
            bc.checkPassword(req.body.password, results.rows[0].password).then(
                matched => {
                    if (matched) {
                        console.log("results", results);
                        req.session.userId = results.rows[0].id;
                        req.session.sigId = results.rows[0].sigid;
                        console.log(results.rows[0].sigid);
                        console.log(
                            "req.sigId if problem, look at DB: ",
                            req.session.sigid
                        );
                        res.redirect("/welcome");
                    } else {
                        res.render("login", {
                            title: "Log in",
                            ifWrong:
                                "Please enter a correct email and password."
                        });
                    }
                }
            );
        })
        .catch(err => {
            console.log("error in the pw", err.message);
            res.render("login", {
                title: "Log in",
                ifWrong: "Please enter a correct email and password."
            });
        });
});

app.get("/welcome", (req, res) => {
    if (req.session.sigId) {
        res.redirect("/thank-you");
    } else if (!req.session.userId) {
        res.redirect("/register");
    } else {
        res.render("welcome", {
            title: "Sign our petition",
            loggedin: true,
            loggedUpdate: true
        });
    }
});

app.post("/welcome", (req, res) => {
    console.log("welcome post route, req.body.sig: ", req.body.signature);
    console.log("req.session.id", req.session.id);
    db.addSignature(req.session.userId, req.body.signature)
        .then(results => {
            req.session.sigId = results.rows[0].id;
            console.log("req.session after add signiture ", req.session);
            res.redirect("/thank-you");
        })
        .catch(err => {
            console.log("error for signature", err.message);
        });
});

app.get("/thank-you", (req, res) => {
    if (!req.session.sigId && req.session.userId) {
        res.redirect("/welcome");
    } else if (!req.session.sigId && !req.session.userId) {
        res.redirect("/register");
    } else {
        db.getNumOfSigners()
            .then(numSigners => {
                console.log("yolo", req.session);
                db.getSigImg(req.session.sigId).then(signatureId => {
                    res.render("thanks", {
                        title: ":(",
                        signers: numSigners.rows,
                        sigImg: signatureId.rows[0].signature,
                        loggedin: true,
                        loggedUpdate: true
                    });
                });
            })
            .catch(err => {
                console.log("error thank you", err.message);
            });
    }
});
app.get("/signers", (req, res) => {
    db.getUsers().then(results => {
        res.render("signers", {
            title: "Blacklist",
            signers: results.rows,
            loggedin: true,
            loggedUpdate: true
        });
    });
});
app.get("/signers/:city", (req, res) => {
    db.getUsersByCity(req.params.city).then(results => {
        res.render("signerByCity", {
            title: "Blacklist per city",
            signers: results.rows,
            loggedin: true,
            loggedUpdate: true
        });
    });
});

//credit to Will for helping me with part 5
app.get("/update", (req, res) => {
    res.render("update", {
        title: "Update your profile",
        loggedin: true
    });
});
app.post("/update", (req, res) => {
    if (req.body.password == "") {
        db.updateProfileNoPassword(
            req.body.first,
            req.body.last,
            req.body.email,
            req.session.userId
        )
            .then(() => {
                db.updateProfile(
                    req.session.userId,
                    req.body.age,
                    req.body.city,
                    req.body.url
                );
            })
            .then(() => {
                res.redirect("/signedpetition");
            })
            .catch(err => {
                console.log("err in update ", err.message);
            });
    } else {
        bc.hashPassword(req.body.password).then(hash => {
            db.updateProfileAndPassword(
                req.body.first,
                req.body.last,
                req.body.email,
                hash,
                req.session.userId
            )
                .then(() => {
                    db.updateProfile(
                        req.session.userId,
                        req.body.age,
                        req.body.city,
                        req.body.url
                    );
                })
                .then(() => {
                    res.redirect("/thank-you");
                })
                .catch(err => {
                    console.log("err in update: ", err.message);
                });
        });
    }
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/login");
});
app.post("/thank-you", (req, res) => {
    req.session.sigId = null;
    db.deleteSig(req.session.userId).then(() => {
        res.redirect("/welcome");
    });
});

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

if (require.main == module) {
    app.listen(process.env.PORT || 8080, () => console.log("ich listen"));
}
