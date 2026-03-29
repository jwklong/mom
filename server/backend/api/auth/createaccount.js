export default function ({ app, db }) {
    app.post('/api/auth/createaccount', async (req, res) => {
        if (
            !req.body ||
            !req.body.username || req.body.username.length < 3 || req.body.username.length > 20 ||
            !req.body.password || req.body.password.length < 8 || req.body.password.length > 64
        ) {
            res.status(400).end("Invalid parameters");
            return;
        }

        const user = db.createUser(req.body.username, req.body.password);
        if (!user) {
            res.status(400).end("Username already in use");
            return;
        }
        db.update();
        res.status(201).end(user.token);
    });
}