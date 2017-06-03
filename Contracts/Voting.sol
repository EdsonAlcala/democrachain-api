pragma solidity ^0.4.2;

contract Voting {
    mapping(bytes32 => uint8) public votesReceived;
    mapping(address => uint8) public requests;

    event VoteAdded(bytes32 option, uint8 votesNumber);
    event RequestAdded(address sender, uint8 numberOfRequests);

    bytes32[] public options;

    function Voting(bytes32[] options){
        options = options;
    }

    function GetTotalVotesFor(bytes32 option) returns(uint8){
        return votesReceived[option];
    }
    function RequestVoting(){
        requests[msg.sender] += 1;
        RequestAdded(msg.sender, requests[msg.sender]);
    }
    function VoteForOption(bytes32 option) {
        votesReceived[option] += 1;
        VoteAdded(option, votesReceived[option]);
    }
}