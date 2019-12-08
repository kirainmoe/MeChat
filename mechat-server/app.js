(async () =>{
    const express = require('express');
    const expressWs = require('express-ws');
    const bodyParser = require('body-parser');
    const multiparty = require('connect-multiparty');
    const fileUpload = require('express-fileupload');

    const mongoose = require('mongoose');
    mongoose.set('useFindAndModify', false);

    // MeChat server side config
    const config = require('./config');


    console.log("MeChat - A simple WeChat project / by Yume Maruyama");
    console.log("Please wait while server-side is initializing...");

    // serialize express
    const app = express();
    const multipartyMiddleware = multiparty();
    app.use(multipartyMiddleware);
    app.use(bodyParser.json());
    app.use(express.static('public'));
    app.use(fileUpload({
        limits: { fileSize: 3 * 1024 * 1024 },
    }));
    expressWs(app);

    const registerRouter = require('./controllers/router');

    // connect database
    const mechatDb = await mongoose.connect(config.database.getUrl(), {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    console.log('MongoDB successfully initialized.');

    console.log('Registering router...');
    registerRouter(app, mechatDb);
    app.listen(config.server.port);
})();