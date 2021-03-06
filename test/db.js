
var mongo = require('mongodb');
var setup = require('./setup');
var comongo = require('../');
var co = require('co');

describe('db', function () {

  var db, test, _id;

  beforeEach(function () {
    db = setup.db;
    test = setup.test;
    _id = setup._id;
  });

  describe('connect', function () {
    it('should return comongo db', function (done) {
      co(function *() {
        var db = yield comongo.connect(setup.connString);
        db.should.be.instanceOf(comongo.Db);
        yield db.close();
      })(done);
    });
  });

  describe('open', function () {
    it('should open a connection', function (done) {
      co(function *() {
        var server = new comongo.Server(setup.mongoHost.split(':')[0], 27017);
        var db = new comongo.Db(new mongo.Db(setup.mongoName, server, {w: 1}));
        var openCalled = false;

        db._db
          .on('open', function() {
            openCalled = true;
          })
          .on('close', function() {
            openCalled.should.equal(true);
            done();
          });

        db = yield db.open();
        yield db.close();
      })();
    });
  });

  describe('close', function () {
    it('should close connection', function (done) {
      co(function *() {

        db._db
          .on('close', function() {
            done();
          });

        yield db.close();
      })();
    });
  });

  describe('listCollections', function () {
    it('should return cursor', function (done) {
      co(function *() {
        var res = db.listCollections();
        res.should.be.instanceOf(comongo.Cursor);
      })(done);
    });
  });

  describe('collection', function () {
    it('should return collection', function (done) {
      co(function *() {
        var collection = yield db.collection('test_collection');
        collection.should.be.instanceOf(comongo.Collection);
      })(done);
    });
  });

  describe('collections', function () {
    it('should return all collections', function (done) {
      co(function *() {
        var collections = yield db.collections();
        collections.should.have.lengthOf(2); //test and indexes
        collections.forEach(function (collection) {
          collection.should.be.instanceOf(comongo.Collection);
        });
      })(done);
    });
  });

  describe('eval', function () {
    it('should eval string', function (done) {
      co(function *() {
        var res = yield db.eval('function(x){ return x * 3; }', [2]);
        res.should.equal(6);
      })(done);
    });
  });

  describe('addUser', function () {
    // @TODO: Better test?
    it('should add user', function (done) {
      co(function *() {
        var res = yield db.addUser('thom', 'pass123', {roles: ['readWrite']});
        res[0].should.have.keys(['user', 'pwd']);
        res[0].user.should.equal('thom');
      })(done);
    });
  });

  describe('authenticate', function () {
    it('should authenticate user', function (done) {
      co(function *() {
        yield db.addUser('thom', 'pass123', {roles: ['readWrite']});
        var res = yield db.authenticate('thom', 'pass123');
        res.should.equal(true);
      })(done);
    });
  });

  describe('logout', function () {
    it('should logout user', function (done) {
      co(function *() {
        yield db.addUser('thom', 'pass123', {roles: ['readWrite']});
        var res = yield db.authenticate('thom', 'pass123');
        res.should.equal(true);
        res = yield db.logout();
        res.should.equal(true);
      })(done);
    });
  });

  describe('removeUser', function () {
    // @TODO: Better test?
    it('should remove user', function (done) {
      co(function *() {
        yield db.addUser('thom', 'pass123', {roles: ['readWrite']});
        var res = yield db.removeUser('thom');
        res.should.equal(true);
      })(done);
    });
  });

  describe('createCollection', function () {
    it('should create collection', function (done) {
      co(function *() {
        var collection = yield db.createCollection('create_collection');
        collection.should.be.instanceOf(comongo.Collection);

        var collections = yield db.listCollections().toArray();
        var names = collections.map(function (name) { return name.name; });
        names.should.containEql('create_collection');
      })(done);
    });
  });

  describe('command', function () {
    it('should execute command', function (done) {
      co(function *() {
        var res = yield db.command({ ping: 1 });
        res.should.eql({ ok: 1 });
      })(done);
    });
  });

  describe('dropCollection', function () {
    it('should remove collection', function (done) {
      co(function *() {

        yield db.dropCollection('test_collection');
        var collections = yield db.listCollections().toArray();
        var names = collections.map(function (name) { return name.name; });
        names.should.not.containEql('test_collection');
      })(done);
    });
  });

  describe('renameCollection', function () {
    it('should remove collection', function (done) {
      co(function *() {

        yield db.renameCollection('test_collection', 'new_name');
        var collections = yield db.listCollections().toArray();
        var names = collections.map(function (name) { return name.name; });
        names.should.containEql('new_name');
        names.should.not.containEql('test_collection');
      })(done);
    });
  });

  describe('createIndex', function () {
    it('should create index', function (done) {
      co(function *() {
        var res = yield db.createIndex('test_collection', { a: 1, b: 1 });
        res.should.equal('a_1_b_1');
      })(done);
    });
  });

  describe('ensureIndex', function () {
    it('should create index', function (done) {
      co(function *() {
        var test = yield db.collection('test_collection');
        var res = yield db.ensureIndex('test_collection', { c: 1, d: 1 });
        res.should.equal('c_1_d_1');
      })(done);
    });
  });

  describe('indexInformation', function () {
    it('should return indexInformation', function (done) {
      co(function *() {
        var res = yield db.indexInformation('test_collection');
        res.should.eql({
          _id_: [ [ '_id', 1 ] ], hello_1: [ [ 'hello', 1 ] ]
        });
      })(done);
    });
  });

  describe('dropDatabase', function () {
    it('should drop database', function (done) {
      co(function *() {
        var res = yield db.dropDatabase();
        res.should.equal(true);
      })(done);
    });
  });

});

