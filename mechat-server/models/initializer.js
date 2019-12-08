const initializeDatabase = (db) => {
    // create collections
    db.createCollection('mc_users', (err) => {
        if (err)
            console.log(err);
    });
    db.createCollection('mc_options', (err) => {
        if (err)
            console.log(err);
    });
    db.createCollection('mc_messages', (err) => {
        if (err)
            console.log(err);
    });
    db.createCollection('mc_circles', (err) => {
        if (err)
            console.log(err);
    });
};

module.exports = initializeDatabase;