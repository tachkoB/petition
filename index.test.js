const { app } = require("./index");
const supertest = require("supertest");

test("get /home returns an h1 response yo", () => {
    return supertest(app)
        .get("/home")
        .then(res => {
            expect(res.statusCode).toBe(200);
            expect(res.text).toContain("yo");
        });
});

test("post /product redirects to home", () => {
    return (
        supertest(app)
            .post("/product")
            // .send("first=testFirst&last=testLast&email=testEmail&password=testPassword")
            .then(res => {
                expect(res.statusCode).toBe(302);
                expect(res.text).toContain("Found");
                expect(res.headers.location).toContain("/home");
            })
    );
});
