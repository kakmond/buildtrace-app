var express = require('express');
var router = express.Router();
var fs = require('fs');
var bzip = require('bzip-deflate')

var web3 = require('web3');
var endpoint = "http://127.0.0.1:8545" // ganache address
web3 = new web3(new web3.providers.HttpProvider(endpoint));
web3.eth.defaultAccount = web3.eth.accounts[0] // set account as sender

/* TraceStorage smart contract configuration */
var contract_Address = '0x17188885a1aCf7305F1e58EF5F196d85dC736112'
var contract_ABI = "abi/TraceStorage.json";
var json = JSON.parse(fs.readFileSync(contract_ABI));
var abi = json.abi
var contract = new web3.eth.Contract(abi, contract_Address);


/* GET home page. */
router.get('/', function (req, res, next) {
  var pkgSearch = req.query.search
  contract.methods.getTrace().call().then((result) => {
    var objList = []
    for (var i = 0; i < result.length; i++) {
      var ascii = web3.utils.hexToAscii(result[i])
      var decompressedJSON = bzip(ascii).toString()
      var object = JSON.parse(decompressedJSON)
      if (pkgSearch && object.package != pkgSearch) { // check if the query is passed and matching
        continue; // skip to next iteration
      }
      object.id = i
      objList.push(object)
    }
    res.render('index', { traces: objList, search: pkgSearch });
  });
});

/* GET graph page. */
router.get('/build/:id', function (req, res, next) {
  contract.methods.getTrace().call().then((result) => {
    var hex = result[req.params.id]
    if (hex) { // if trace data exists
      var ascii = web3.utils.hexToAscii(hex)
      var decompressedJSON = bzip(ascii).toString()
      var object = JSON.parse(decompressedJSON)
      console.log(object)
      res.render('graph', { title: 'Express', graph: object });
    }
    else
      res.render('error', { message: 'buildtrace ID: ' + req.params.id + ' cannot be found.' });
  });

});

module.exports = router;