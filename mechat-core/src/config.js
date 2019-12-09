const production = process.env.NODE_ENV === 'production';

export default {
    apiUrl: production ? 'http://aya.kirainmoe.com:61616/' : 'http://localhost:61616/',
    wsUrl: production ? 'ws://aya.kirainmoe.com:61616/entry' : 'ws://localhost:61616/entry',
};