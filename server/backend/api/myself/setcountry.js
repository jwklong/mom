export default async function({ app, db, user }) {
    app.post('/api/myself/setcountry', async (req, res) => {
        if (
            !req.body ||
            !req.body.token || req.body.token.length !== 32 ||
            !req.body.country || req.body.country.length !== 2
        ) {
            res.status(400).end("Invalid parameters");
            return;
        }

        const user = db.authenticate(req.body.token);
        if (!user) {
            res.status(400).end("Invalid token");
            return;
        }
        user.setCountry(req.body.country);
        db.update();
        res.end();
    });
}