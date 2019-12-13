const production = process.env.NODE_ENV === 'production';

export default {
    apiUrl: production ? 'http://103.81.187.96:61616/' : 'http://localhost:61616/',
    wsUrl: production ? 'ws://103.81.187.96:61616/entry' : 'ws://localhost:61616/entry',
    // apiUrl: 'http://localhost:61616/',
    // wsUrl: 'ws://localhost:61616/entry,
};