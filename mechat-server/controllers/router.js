const UserController = require('./UserController');
const ProfileController = require('./ProfileController');
const CharController = require('./ChatController');

const connectionMap = new Map();

const UserSchema = require('../schemas/UserSchema');
const ObjectId = require('mongoose').Types.ObjectId;

const registerRouter = (app, db) => {
    const user = new UserController(db);
    const profile = new ProfileController(db);
    const chat = new CharController(db);

    const udb = db.model('mc_users', UserSchema);

    // cors
    app.all('*', function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        next();
    });

    // index
    app.get('/', (req, res) => {
        res.send('Hello! This is MeChat server!');
    });

    // login & register
    app.post('/register', (req, res) => {
        user.register(req, res);
    });
    app.post('/login', (req, res) => {
        user.login(req, res);
    });

    // user info
    app.get('/avatar', (req, res) => {
        user.getUserAvatar(req, res);
    });
    app.post('/friends', (req, res) => {
        profile.getFriends(req, res);
    });
    app.post('/addFriend', (req, res) => {
        profile.addFriends(req, res);
    });
    app.post('/updateProfile', (req, res) => {
        profile.updateProfile(req, res);
    });
    app.post('/uploadAvatar', (req, res) => {
        profile.uploadAvatar(req, res);
    });
    app.post('/changeAlias', (req, res) => {
        profile.changeAlias(req, res);
    })

    // message interface
    app.post('/sendMessage', (req, res) => {
        chat.sendMessage(req, res, connectionMap);
    });
    app.post('/getMessageList', (req, res) => {
        chat.getMessageList(req, res);
    })

    // websocket
    app.ws('/entry', async (ws, req) => {
        console.log('new websocket connection established.');
        ws.uid = null;

        ws.on('message', async (msg) => {
            try {
                const userInfo = JSON.parse(msg);
                if (!userInfo.uid || !userInfo.token)
                    return;
                connectionMap[userInfo.uid] = ws;
                ws.uid = userInfo.uid;

                const user = await udb.findOne({ _id: ObjectId(ws.uid) });
                if (user == null || user.auth_token != userInfo.token) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Auth failed.'
                    }));
                    ws.close();
                }
                udb.findOneAndUpdate({
                   _id: ObjectId(ws.uid) 
                }, {
                    $set: {
                        online: 1
                    }
                }, () => {});

                console.log("websocket from UID %s has registered.", userInfo.uid);
            } catch(e) {
                console.log(e);
                ws.close();
            }
        });

        ws.on('close', () => {
            console.log('connection of ' + ws.uid + ' closed');
            connectionMap[ws.uid] = undefined;
            udb.findOneAndUpdate({
                _id: ObjectId(ws.uid)
            }, {
                $set: {
                    online: 0
                }
            }, () => {});
        });
    });
    console.log('Router registered.');
};

module.exports = registerRouter;