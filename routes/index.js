const express = require('express');
const router = express.Router();
const azure = require('azure');
const Web3 = require('web3');
const solc = require('solc');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('DemocrachainDB');

const notificationHubService = azure.createNotificationHubService('democrachainhub', 'Endpoint=sb://democrachain.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=zbZNzcWmuGrNuLPgoJDCWLFc4SdXCFEg+x9Ms5BB+oI=');
const rpcLocalFromAccount = "0x1c25ef6055f5584e42c29f63c5535a740e0bbbd7";
const ropstenFromAccount = "0x1c25ef6055f5584e42c29f63c5535a740e0bbbd7";
const rpcLocalHttpURL = "http://localhost:8545";
const ropstenHttpURL = "http://localhost:8545";
const httpProviderUrl = process.env.NODE_ENV == 'development' ? rpcLocalHttpURL : ropstenHttpURL;
const accountCode = process.env.NODE_ENV == 'development' ? rpcLocalFromAccount : ropstenFromAccount;
const web3 = new Web3(new Web3.providers.HttpProvider(httpProviderUrl));

let code = fs.readFileSync('./Contracts/Voting.sol').toString();

web3.eth.defaultAccount = accountCode;
let votingContractCompiled = solc.compile(code, 1);

//using solc
let votingContractCode = "0x" + votingContractCompiled.contracts[":Voting"].bytecode;
let votingContractAbi = JSON.parse(votingContractCompiled.contracts[":Voting"].interface);
let votingContract = web3.eth.contract(votingContractAbi);
let votingContractInstance = votingContract.at("0x3175aDb322E74BD892286a5c179800338a6c835B");
let readyToGetInfo = false;

//deployNewContract();
function initializeDatabase(contractAddress, callback) {
  db.serialize(function () {
    db.run("CREATE TABLE IF NOT EXISTS Information (Name TEXT, Value TEXT)");
    db.run("DELETE FROM Information");

    db.run("INSERT INTO Information VALUES($name, $value)", {
      $name: "ContractAbi",
      $value: JSON.stringify(votingContractAbi)
    });

    db.run("INSERT INTO Information VALUES($name, $value)", {
      $name: "FromAddress",
      $value: web3.eth.defaultAccount
    });

    db.run("INSERT INTO Information VALUES($name, $value)", {
      $name: "ContractAddress",
      $value: contractAddress
    }, callback);
  });
}
var VOTING_TIME = 1;
function deployNewContract() {
  let deployedContract = votingContract.new(['Yes', 'No'],
    { data: votingContractCode, from: web3.eth.defaultAccount, gas: 470000 },
    function (error, myContract) {
      if (error) {
        console.log(error);
        return;
      }
      if (myContract.address) {
        console.log("Address:" + myContract.address);
        initializeDatabase(myContract.address, function () {
          readyToGetInfo = true;
        });
      }
    }
  );
}

initializeDatabase("0x3175aDb322E74BD892286a5c179800338a6c835B", function () {
  readyToGetInfo = true;
});

/* GET home page. */
router.get('/', function (req, res) {
  res.render('index', { title: 'Arduino API' });
});

function getData() {
  let contractResultAbi;
  let contractResultAddress;
  let fromResultAddress;
  return new Promise(function (resolve, reject) {
    db.serialize(function () {

      db.get("SELECT Value FROM Information WHERE Name = $name", {
        $name: "ContractAbi"
      }, function (err, row) {
        contractResultAbi = row.Value;
      });

      db.get("SELECT Value FROM Information WHERE Name = $name", {
        $name: "ContractAddress"
      }, function (err, row) {
        contractResultAddress = row.Value;
      });

      db.get("SELECT Value FROM Information WHERE Name = $name", {
        $name: "FromAddress"
      }, function (err, row) {
        fromResultAddress = row.Value;
        resolve({
          "ContractAbi": contractResultAbi,
          "ContractAddress": contractResultAddress,
          "FromAddress": fromResultAddress
        });
      });
    });
  });
}

router.get('/information', function (req, res) {
  if(!readyToGetInfo){
    return res.sendStatus(500);
  }
  getData().then(function(result){
    res.json(result);
  });
});



router.get('/decline', function (req, res) {
  //i need the response as parameter
  let approved = false;//vote

  votingContractInstance.VoteForOption.sendTransaction('No', { from: web3.eth.defaultAccount },
    function (error, result) {
      if (error) {
        console.log(error)
        return;
      }
      var newNumberOfVotes = votingContractInstance.GetTotalVotesFor.call('Yes');
      console.log("New number of votes: " + newNumberOfVotes);
    });

  res.sendStatus(200);
});


router.get('/approve', function (req, res) {
  //i need the response as parameter
  let approved = true;//vote

  votingContractInstance.VoteForOption.sendTransaction('Yes', { from: web3.eth.defaultAccount },
    function (error, result) {
      if (error) {
        console.log(error)
        return;
      }
      var newNumberOfVotes = votingContractInstance.GetTotalVotesFor.call('Yes');
      console.log("New number of votes: " + newNumberOfVotes);
    });

  res.sendStatus(200);
});


router.get('/notify', function (req, res) {
  //send notification test
  var payload = {
    alert: 'Edson wants to turn on the Light.'
  };
  notificationHubService.apns.send(null, payload, function (error) {
    if (!error) {
      res.sendStatus(200);
    } else {
      res.sendStatus(500);
    }
  });
});

module.exports = router;