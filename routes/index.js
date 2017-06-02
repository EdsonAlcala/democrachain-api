const express = require('express');
const router = express.Router();
const azure = require('azure');
const Web3 = require('web3');
const fs = require('fs');
let notificationHubService = azure.createNotificationHubService('democrachainhub', 'Endpoint=sb://democrachain.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=cOJJLfK1QbKGI5HupjEBlecDS4S4vGrIpoUTjxG7GUk=');
let web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
let solc = require('solc');
let code = fs.readFileSync('./Contracts/Voting.sol').toString();

//default account
web3.eth.defaultAccount = '0x50f1c865895556ed00c1c8c1014e7be029256c67';
let votingContractCompiled = solc.compile(code, 1);//web3.eth.compile.solidity(code)
//let votingContractCompiled = web3.eth.compile.solidity(code);
//let votingContractAbi = votingContractCompiled.info.abiDefinition;
//using solc
let votingContractCode = "0x"+votingContractCompiled.contracts[":Voting"].bytecode;
let votingContractAbi = JSON.parse(votingContractCompiled.contracts[":Voting"].interface);
let votingContract = web3.eth.contract(votingContractAbi);
let votingContractInstance;
let deployedContract = votingContract.new(['Yes', 'No'],
  { data: votingContractCode, from: web3.eth.defaultAccount, gas: 470000 },
  function (err, myContract) {
    if (!err) {
      if (myContract.address) {
        votingContractInstance = votingContract.at(myContract.address);
        var numberVotes = votingContractInstance.GetTotalVotesFor.call('Yes');
        console.log("Number of votes: " + numberVotes);
        votingContractInstance.VoteForOption.sendTransaction('Yes', {from: web3.eth.defaultAccount}, function(err, result){
          var newNumberOfVotes = votingContractInstance.GetTotalVotesFor.call('Yes');
          console.log("New number of votes: " + newNumberOfVotes);
        });
      }
    }
  }
);


//getting existing contract

/* GET home page. */
router.get('/', function (req, res) {
  res.render('index', { title: 'Democrachain API' });
});

router.get('/notify', function (req, res) {
  //send notification test
  var payload = {
    alert: 'Edson wants to turn on the Air conditioner.'
  };
  notificationHubService.apns.send(null, payload, function (error) {
    if (!error) {
      res.sendStatus(200);
    } else {
      res.sendStatus(500);
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
