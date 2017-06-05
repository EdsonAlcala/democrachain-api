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

// router.get('/request', function (req, res) {
//   return new Promise(function (resolve, reject) {
//     var numberVotes = votingContractInstance.GetTotalVotesFor.call('Yes');
//     console.log("Number of votes: " + numberVotes);


//     votingContractInstance.RequestVoting.sendTransaction({ from: web3.eth.defaultAccount }, function (error, result) {
//       if (error) {
//         console.log(error);
//         reject(false);
//         return;
//       }
//       var newNumberOfVotes = votingContractInstance.GetTotalVotesFor.call('Yes');
//       console.log("New number of votes: " + newNumberOfVotes);
//     });

//     var requestAddedEvent = votingContractInstance.RequestAdded('latest');
//     requestAddedEvent.watch(function (error, result) {
//       if (error) {
//         console.log(error);
//         reject(false);
//         return;
//       }
//       console.log(result)
//       requestAddedEvent.stopWatching();
//       resolve(true);
//     });
//   });
// });



//router.get('/vote', function (req, res) {
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

//   votingContractInstance.VoteForOption.sendTransaction('Yes', { from: web3.eth.defaultAccount },
//     function (error, result) {
//       if (error) {
//         console.log(error)
//         return;
//       }
//       var newNumberOfVotes = votingContractInstance.GetTotalVotesFor.call('Yes');
//       console.log("New number of votes: " + newNumberOfVotes);
//     });

//   res.sendStatus(200);
// });




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
