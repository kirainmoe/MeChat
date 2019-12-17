const production = process.env.NODE_ENV === 'production';

export default {
    apiUrl: production ? 'https://mechat.kirainmoe.com/' : 'http://localhost:61616/',
    wsUrl: production ? 'ws://mechat.kirainmoe.com/entry' : 'ws://localhost:61616/entry',
};