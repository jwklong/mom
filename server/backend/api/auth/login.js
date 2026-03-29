export default function ({ app, db }) {
    app.post('/api/auth/login', async (req, res) => {
        if (
            !req.body ||
            !req.body.username || req.body.username.length < 3 || req.body.username.length > 20 ||
            !req.body.password || req.body.password.length < 8 || req.body.password.length > 64
        ) {
            res.status(400).end("Invalid parameters");
            return;
        }

        const user = db.login(req.body.username, req.body.password);
        if (!user) {
            res.status(400).end("Invalid username or password");
            return;
        }
        db.update();
        res.end(user.token);
    });
}