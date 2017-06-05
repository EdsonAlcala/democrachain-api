const express = require('express');
const router = express.Router();
const azure = require('azure');
const Web3 = require('web3');
const solc = require('solc');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('DemocrachainDB');

const notificationHubService = azure.createNotificationHubService('democrachainhub', 'Endpoint=sb://democrachain.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=cOJJLfK1QbKGI5HupjEBlecDS4S4vGrIpoUTjxG7GUk=');
const rpcLocalFromAccount = '0xba6fe142d4e0104c0fbdef7a3fd5ffa122ab712c';
const ropstenFromAccount = '0x7688272927dcbc77858c622847ec05fb0a6fadb1';
const rpcLocalHttpURL = "http://localhost:8545";
const ropstenHttpURL = "http://23.98.223.9:8545";
const Promise = require('bluebird');
//const db = require('sqlite');
const httpProviderUrl = process.env.NODE_ENV == 'development' ? rpcLocalHttpURL : ropstenHttpURL;
const accountCode = process.env.NODE_ENV == 'development' ? rpcLocalFromAccount : ropstenFromAccount;
const web3 = new Web3(new Web3.providers.HttpProvider(httpProviderUrl));

let code = fs.readFileSync('./Contracts/Voting.sol').toString();

web3.eth.defaultAccount = accountCode;
let votingContractCompiled = solc.compile(code, 1);

//using solc
let votingContractCode = "0x" + votingContractCompiled.contracts[":Voting"].bytecode;
let votingContractAbi = JSON.parse(votingContractCompiled.contracts[":Voting"].interface);
console.log("ABI:" + votingContractCompiled.contracts[":Voting"].interface);

let votingContract = web3.eth.contract(votingContractAbi);
let votingContractInstance;

function fillDatabase() {
  return new Promise(function (resolve, reject) {
    db.serialize(function () {
      db.run("CREATE TABLE IF NOT EXISTS Information (Name TEXT, Value TEXT)");
      db.run("DELETE FROM Information");

      db.run("INSERT INTO Information VALUES($name, $value)", {
        $name: "ContractAbi",
        $value: JSON.stringify(votingContractAbi)
      });

      // db.run("INSERT INTO Information VALUES($name, $value)", {
      //   $name: "ContractAddress",
      //   $value: contractAddress
      // });

      db.run("INSERT INTO Information VALUES($name, $value)", {
        $name: "FromAddress",
        $value: web3.eth.defaultAccount
      });
      // db.each("SELECT * FROM Information", function (err, row) {
      //   console.log(row.Name + ": " + row.Value);
      // });
    });

    db.close();
    resolve(true);
  });
}

function deployNewContract() {
  return new Promise(function (resolve, reject) {
    let deployedContract = votingContract.new(['Yes', 'No'],
      { data: votingContractCode, from: web3.eth.defaultAccount, gas: 470000 },
      function (error, myContract) {
        if (error) {
          console.log(error);
          reject(false);
          return;
        }
        if (myContract.address) {
          console.log("Address:" + myContract.address);
          votingContractInstance = votingContract.at(myContract.address);
          var numberVotes = votingContractInstance.GetTotalVotesFor.call('Yes');
          console.log("Number of votes: " + numberVotes);
          var fillDatabasePromise = fillDatabase(myContract.address);
          fillDatabasePromise.then(function (result) {
            resolve(true);
          })
        }
      }
    );
  });
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
          console.log("callback 2:" + row.Value);
          contractResultAddress = row.Value;
        });

        db.get("SELECT Value FROM Information WHERE Name = $name", {
          $name: "FromAddress"
        }, function (err, row) {
          console.log("callback 3:" + row.Value);
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
  getData().then(function(result){
    res.json(result);
  });  
});

// router.get('/start', function (req, res) {
// });

// Promise.resolve()
//   // First, try connect to the database
//   .then(() => db.open('../DemocrachainDB.sqlite', { Promise }))
//   .catch(err => console.error(err.stack))
//   // Finally, launch Node.js app
//   .finally(() => app.listen(port));

//app.get('/post/:id', async (req, res, next) => {
// router.get('/data', async (req, res, next) => {
//   try {
//     const [contractResultAbi, contractResultAddress, fromResultAddress] = await Promise.all([
//       db.get("SELECT Value FROM Information WHERE Name = $name", {
//         $name: "ContractAbi"
//       }),
//       db.get("SELECT Value FROM Information WHERE Name = $name", {
//         $name: "ContractAddress"
//       }),
//       db.get("SELECT Value FROM Information WHERE Name = $name", {
//         $name: "FromAddress"
//       })
//     ]);
//     res.json({
//       "ContractAbi": contractResultAbi,
//       "ContractAddress": contractResultAddress,
//       "FromAddress": fromResultAddress
//     });
//   } catch (err) {
//     next(err);
//   }


  // var deploymentPromise = deployNewContract();
  // deploymentPromise.then(function (result) {
  //   if(result){
  //     res.sendStatus(200);
  //   }
  //   else{
  //     res.sendStatus(500);
  //   }
  // db.get("SELECT Value FROM Information WHERE Name = $name", {
  //   $name: "ContractAbi"
  // }, function (err, row) {
  //   contractResultAbi = row.Value;
  //   db.get("SELECT Value FROM Information WHERE Name = $name", {
  //     $name: "ContractAddress"
  //   }, function (err, row) {
  //     contractResultAddress = row.Value;
  //     db.get("SELECT Value FROM Information WHERE Name = $name", {
  //       $name: "FromAddress"
  //     }, function (err, row) {
  //       fromResultAddress = row.Value;
  //       res.json({
  //         "ContractAbi": contractResultAbi,
  //         "ContractAddress": contractResultAddress,
  //         "FromAddress": fromResultAddress
  //       });
  //     });
  //   });
  // });

  // });
//});

router.get('/request', function (req, res) {
  return new Promise(function (resolve, reject) {
    var numberVotes = votingContractInstance.GetTotalVotesFor.call('Yes');
    console.log("Number of votes: " + numberVotes);


    votingContractInstance.RequestVoting.sendTransaction({ from: web3.eth.defaultAccount }, function (error, result) {
      if (error) {
        console.log(error);
        reject(false);
        return;
      }
      var newNumberOfVotes = votingContractInstance.GetTotalVotesFor.call('Yes');
      console.log("New number of votes: " + newNumberOfVotes);
    });

    var requestAddedEvent = votingContractInstance.RequestAdded('latest');
    requestAddedEvent.watch(function (error, result) {
      if (error) {
        console.log(error);
        reject(false);
        return;
      }
      console.log(result)
      requestAddedEvent.stopWatching();
      resolve(true);
    });
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




// votingContractInstance = votingContract.at('0x09D8eB28b39cF535365372A31fd320AF680C83f1');

// //getting existing contract
// var numberVotes = votingContractInstance.GetTotalVotesFor.call('Yes');
// console.log("Number of votes: " + numberVotes);

// var voteAddedEvent = votingContractInstance.VoteAdded('latest');

// voteAddedEvent.watch(function (error, result) {
//   if (error) {
//     console.log(error)
//     return;
//   }
//   console.log(result)
//   voteAddedEvent.stopWatching();
// });

// requestAddedEvent.watch(function (error, result) {
//   if (error) {
//     console.log(error)
//     return;
//   }
//   console.log(result)
//   requestAddedEvent.stopWatching();
// });
//}

// watch for an event with {some: 'args'}
// var events = votingContractInstance.allEvents({ fromBlock: 0, toBlock: 'latest' });
// events.watch(function (error, result) {
//   if (error) {
//     console.log(error);
//     return;
//   }
//   console.log(result);//result.event == 'VoteAdded'
// });
// Additionally you can start watching right away, by passing a callback:
// var filter = web3.eth.filter({ fromBlock: 0, toBlock: 'latest' });
// filter.watch(function (error, result) {
//   if (!error)
//     console.log(result);
// });

module.exports = router;
