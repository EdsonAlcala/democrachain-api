pragma solidity ^0.4.2;

contract Voting {
    mapping(bytes32 => uint8) public votesReceived;
    event VoteAdded(bytes32 option, uint8 votesNumber);
    bytes32[] public options;

    function Voting(bytes32[] options){
        options = options;
    }

    function GetTotalVotesFor(bytes32 option) returns(uint8){
        return votesReceived[option];
    }

    function VoteForOption(bytes32 option){
        votesReceived[option] += 1;
        VoteAdded(option, votesReceived[option]);
    }
}