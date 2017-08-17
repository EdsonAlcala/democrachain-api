const express = require('express');
const router = express.Router();
const azure = require('azure');
const Web3 = require('web3');
const solc = require('solc');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('DemocrachainDB');

const notificationHubService = azure.createNotificationHubService('arduinohub', 'Endpoint=sb://arduino-hub.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=bwCGaMxSAfcX2r0+ip9cQmJfCci6XOSQPIdQM2ET52E=');
const rpcLocalFromAccount = '0xb8f85e2ce964f864f2ccec58e47859699034660d';
const ropstenFromAccount = "0xb8f85e2ce964f864f2ccec58e47859699034660d";
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
let votingContractInstance;
let readyToGetInfo = false;

deployNewContract();
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

router.get('/turnon', function (req, res) {
  if (!readyToGetInfo) {
    return res.sendStatus(500);
  }

  //get from address, in the beginning there is hardcoded address but the Arduino has to know their Address, ok?
  var fromAddress = web3.eth.defaultAccount;
  getData().then(function (result) {
    votingContractInstance = votingContract.at(result.ContractAddress);
    var contractEvent = votingContractInstance.RequestAdded();
    // var contractListener = contractEvent.watch(function (error, result) {
    //   if (error) {
    //     console.log(error);
    //     res.json(error);
    //     return;
    //   }
    //   res.json(result);    
    //   contractEvent.stopWatching();
    //   console.log(result.args);
    // });
    votingContractInstance.RequestVoting.sendTransaction({ gas: 4712388 });
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