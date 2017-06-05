const express = require('express');
const router = express.Router();
const azure = require('azure');
const Web3 = require('web3');
const solc = require('solc');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('DemocrachainDB');

const notificationHubService = azure.createNotificationHubService('democrachainhub', 'Endpoint=sb://democrachain.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=cOJJLfK1QbKGI5HupjEBlecDS4S4vGrIpoUTjxG7GUk=');
const rpcLocalFromAccount = '0xa9fb5301f194aa13bc9e77cbddd39ecacdc2d947';
const ropstenFromAccount = '0x7688272927dcbc77858c622847ec05fb0a6fadb1';
const rpcLocalHttpURL = "http://localhost:8545";
const ropstenHttpURL = "http://23.98.223.9:8545";
const httpProviderUrl = process.env.NODE_ENV == 'development' ? rpcLocalHttpURL : ropstenHttpURL;
const accountCode = process.env.NODE_ENV == 'development' ? rpcLocalFromAccount : ropstenFromAccount;
const web3 = new Web3(new Web3.providers.HttpProvider(httpProviderUrl));

let code = fs.readFileSync('./Contracts/Voting.sol').toString();

web3.eth.defaultAccount = accountCode;
let votingContractCompiled = solc.compile(code, 1);

//using solc
let votingContractCode = "0x" + votingContractCompiled.contracts[":Voting"].bytecode;
let votingContractAbi = JSON.parse(votingContractCompiled.contracts[":Voting"].interface);
//console.log("Getting ABI and Code");
//console.log("ABI:" + votingContractCompiled.contracts[":Voting"].interface);
let votingContract = web3.eth.contract(votingContractAbi);
let votingContractInstance;
let readyToGetInfo = false;

//initializeDatabase();
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
  // db.close(callback);
}
function insertContractAddress(contractAddress, callback){

}

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
          votingContractInstance = votingContract.at(myContract.address);
          var numberVotes = votingContractInstance.GetTotalVotesFor.call('Yes');
          console.log("Number of votes: " + numberVotes);
          initializeDatabase(myContract.address, function(){
            readyToGetInfo = true;
            //db.close();
          });
        }
      }
    );
}

/* GET home page. */
router.get('/', function (req, res) {
  res.render('index', { title: 'Democrachain API' });
});

function getData(){
  let contractResultAbi;
  let contractResultAddress;
  let fromResultAddress;
  return new Promise(function(resolve, reject){
    db.serialize(function () {

        db.get("SELECT Value FROM Information WHERE Name = $name", {
          $name: "ContractAbi"
        }, function (err, row) {
          console.log("callback 1:" + row.Value);
          contractResultAbi = row.Value;
        });

        db.get("SELECT Value FROM Information WHERE Name = $name", {
          $name: "ContractAddress"
        }, function (err, row) {
          //console.log("callback 2:" + row.Value);
          contractResultAddress = row.Value;
        });

        db.get("SELECT Value FROM Information WHERE Name = $name", {
          $name: "FromAddress"
        }, function (err, row) {
          //console.log("callback 3:" + row.Value);
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

module.exports = router;
