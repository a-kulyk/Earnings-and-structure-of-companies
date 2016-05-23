var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');
var tree = require('./tree');

var app = express();
app.use(express.static('public'));
app.use(bodyParser.json());

app.get('/tree.json', function(req, res) {
    res.send(tree);
});

app.post('/submit', function(req, res) {

    fs.writeFile('tree.json', JSON.stringify(req.body), function(err) {
      if (err) console.log(err);
      console.log('It\'s saved!');
    });
    res.sendStatus(200);

});

var port = 3000;
app.listen(port, function() {
    console.log("Listening on port 3000");
});