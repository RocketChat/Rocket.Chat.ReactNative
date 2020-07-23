rs.initiate({
    _id: 'rs0',
    members: [ { _id: 0, host: 'localhost:27017' } ]})

var masterness = db.isMaster().ismaster
print("MongoDB Master initial state: " + masterness)
while(db.isMaster().ismaster==false) {
    print("Waiting for MongoDB election")
    sleep(1000)
}
print("Election complete! Ready for data imports.")