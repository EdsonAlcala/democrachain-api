var express = require('express');
var router = express.Router();
var azure = require('azure');
var Web3 = require('web3');
// create an instance of web3 using the HTTP provider.
// NOTE in mist web3 is already available, so check first if its available before instantiating
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
var notificationHubService = azure.createNotificationHubService('democrachainhub', 'Endpoint=sb://democrachain.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=cOJJLfK1QbKGI5HupjEBlecDS4S4vGrIpoUTjxG7GUk=');

let pollContractAbi = [{ "constant": true, "inputs": [{ "name": "", "type": "uint256" }], "name": "proposals", "outputs": [{ "name": "name", "type": "string" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "name", "type": "string" }], "name": "newProposal", "outputs": [{ "name": "proposalID", "type": "uint256" }], "payable": false, "type": "function" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "proposalID", "type": "uint256" }, { "indexed": false, "name": "name", "type": "string" }], "name": "ProposalAdded", "type": "event" }];

let pollContractAddress = '0xac959204c5be3bbfa318ba7400e15806727f6319';

let pollContract = web3.eth.contract(pollContractAbi).at(pollContractAddress);

/* GET home page. */
router.get('/', function (req, res) {

  res.render('index', { title: 'Express' });
});

router.get('/notify', function (req, res) {
  //send notification test
  var payload = {
    alert: 'Hello!'
  };
  notificationHubService.apns.send(null, payload, function (error) {
    if (!error) {
      // notification sent
    }
  });
});

router.get('/vote', function (req, res) {
  // //i need the response as parameter
  // let approved = true;//vote

  // //interact with smart contract
  //  var voteAddedEvent = pollContract.voteAdded();
  //   voteAddedEvent.watch(function (err, result) {
  //     if (err) {
  //       console.log(err)
  //       return;
  //     }
  //     console.log(result.args.name)
  //     // check that result.args._from is web3.eth.coinbase then
  //     // display result.args._value in the UI and call    
  //     // exampleEvent.stopWatching()
  //     //debugger;
  //   });

  //   //vote
  //   pollContract.vote.sendTransaction(approved, { from: web3.eth.coinbase });
  res.sendStatus(200);
});


module.exports = router;
