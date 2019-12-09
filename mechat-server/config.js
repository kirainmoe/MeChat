const path = require('path');

const config = {
    server: {
        port: 61616
    },
    database: {
        type: 'mongodb',
        host: 'localhost',
        port: 27017,
        username: '',
        password: '',
        dbname: 'mechat',
        getUrl: function() {
            if (this.username == '')
                return `mongodb://${this.host}:${this.port}/${this.dbname}`;
            return `mongodb://${this.username}:${this.password}@${this.host}:${this.port}/${this.dbname}`;
        }
    },
    avatarPath: __dirname + '/public/avatar/'
};

module.exports = config;