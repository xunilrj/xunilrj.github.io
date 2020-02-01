import PouchDB from 'pouchdb-browser';
import inmemory from 'pouchdb-adapter-memory';
import lunr from 'lunr';

PouchDB.plugin(inmemory);
var db = new PouchDB('documents', {adapter: 'memory'});

var documents = [{
    "name": "Lunr",
    "text": "Like Solr, but much smaller, and not as bright."
  }, {
    "name": "React",
    "text": "A JavaScript library for building user interfaces."
  }, {
    "name": "Lodash",
    "text": "A modern JavaScript utility library delivering modularity, performance & extras."
}];
var idx = lunr(function () {
    this.ref('name')
    this.field('text')
    documents.forEach(function (doc) {
        this.add(doc);
    }, this);
});
document.getElementById("query").addEventListener('keyup', x => {
    var query = x.target.value;    
    console.log(idx.search(query));
});
