const mongoClient = require('mongodb').MongoClient
const state = {
    db: null
}

module.exports.connect = function (done) {
    const url = 'mongodb+srv://velvetstore:lceQfQJ1SCBrD2fj@cluster0.dxv6kr8.mongodb.net/test'
    const dbname = 'shopping'

    mongoClient.connect(url, (err, data) => {
        if (err) return done(err)
        state.db = data.db(dbname)
        done()
    })
}

module.exports.get = function () {
    return state.db    
}