import sql from 'sql.js';

var worker = new Worker("./node_modules/sql.js/js/worker.sql.js"); // You can find worker.sql.js in this repo
worker.onmessage = x => console.log(x);
worker.onerror = e => console.log("Worker error: ", e);

worker.postMessage({
  id: 2,
  action: 'exec',
  sql: 'CREATE TABLE hello (a int, b char);'
});