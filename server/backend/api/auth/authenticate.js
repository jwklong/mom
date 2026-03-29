export default function ({ app, db }) {
    app.post('/api/auth/authenticate', async (req, res) => {
        if (
            !req.body ||
            !req.body.token || req.body.token.length !== 32
        ) {
            res.status(400).end("Invalid parameters");
            return;
        }

        const user = db.authenticate(req.body.token);
        if (!user) {
            res.status(400).end("Invalid token");
            return;
        }
        res.end(JSON.stringify(user.safeObject()));
    });
}