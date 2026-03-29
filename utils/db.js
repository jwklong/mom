import { JSONFilePreset } from 'lowdb/node';
import crypto from 'node:crypto';
import * as logger from './logger.js';

const deepMerge = (a, b) => {
    for (const key in b) {
        if (typeof a[key] === 'object' && typeof b[key] === 'object') {
            deepMerge(a[key], b[key]);
        } else {
            a[key] = b[key];
        }
    }
};

const tokenExpiry = 1000 * 60 * 60 * 24 * 3; // 3 days

export class Database {
    static defaultData = {
        users: {}
    };

    constructor() {
        this.db = null;
    }

    async init(file) {
        this.db = await JSONFilePreset(file, {});
        deepMerge(this.db.data, Database.defaultData);
        await this.update(true);
        logger.info("Database initialized");
    }

    get data() {return this.db.data;}
    set data(x) {this.db.data = x;}

    async update(silent = false) {
        await this.db.write();
        if (!silent) logger.info("Database updated");
    }

    createUser(username, password) {
        if (Object.values(this.db.data.users).find(user => user.username === username)) {
            return null;
        }
        const user = new User(this, {
            id: crypto.randomBytes(16).toString('hex'),
            username,
            passwordEncrypted: crypto.createHash('sha256').update(password).digest('hex'),
            token: crypto.randomBytes(16).toString('hex'),
            tokenExpiration: Date.now() + tokenExpiry,
            creationTime: Date.now(),
            country: "XX"
        });
        this.updateUser(user);
        return user;
    }

    updateUser(user) {
        this.db.data.users[user.id] = {
            id: user.id,
            username: user.username,
            passwordEncrypted: user.passwordEncrypted,
            token: user.token,
            tokenExpiration: user.tokenExpiration,
            creationTime: user.creationTime,
            country: user.country
        };
    }

    getUser(id) {
        return new User(this, this.db.data.users[id]);
    }

    authenticate(token) {
        const user = Object.values(this.db.data.users).find(user => user.token === token);
        if (user && user.tokenExpiration > Date.now()) {
            return new User(this, user);
        }
    }

    login(username, password) {
        const user = Object.values(this.db.data.users).find(user => user.username === username);
        if (user && user.passwordEncrypted === crypto.createHash('sha256').update(password).digest('hex')) {
            let output = new User(this, user);
            output.renewToken();
            return output;
        }
    }
}

export class User {
    constructor(db, data) {
        this.db = db;
        this.id = data.id;
        this.username = data.username;
        this.passwordEncrypted = data.passwordEncrypted;
        this.token = data.token;
        this.tokenExpiration = data.tokenExpiration;
        this.creationTime = data.creationTime;
        this.country = data.country;
    }

    safeObject() {
        return {
            id: this.id,
            username: this.username,
            creationTime: this.creationTime,
            country: this.country
        };
    }

    update() {
        this.db.updateUser(this);
    }

    renewToken() {
        this.token = crypto.randomBytes(16).toString('hex');
        this.tokenExpiration = Date.now() + tokenExpiry;
        this.update();
    }

    setCountry(country) {
        this.country = country;
        this.update();
    }
}