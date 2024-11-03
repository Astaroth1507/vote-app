// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.27;

contract Vote {
    struct Proposal {
        string name;
        uint votesCount;
    }

    struct Voter {
        bool voted;  // Indica si la persona ha votado en esta ronda
        uint vote;   // Índice de la propuesta seleccionada por el votante
        uint votingRound;  // Almacena la ronda en la que votó
    }

    Proposal[] public proposals;
    address public chairperson;
    bool public votingOpen = true;
    uint public votingRound = 1;
    mapping(address => Voter) public voters;
    address[] public voterAddresses;

    event ProposalAdded(string name);
    event VoteCast(address indexed voter, uint proposalIndex);
    event VotingReset(uint newRound);
    event VotingStatusChanged(bool status);
    event ProposalsCleared();

    modifier onlyAdministrator() {
        require(msg.sender == chairperson, "unicamente el administrador puede agregar candidatos");
        _;
    }

    modifier onlyUsersNotVotedYet() {
        require(votingOpen, "La votacion esta cerrada.");
        Voter storage sender = voters[msg.sender];
        require(!sender.voted || sender.votingRound < votingRound, "Ya has enviado tu voto en esta ronda");
        _;
    }

    constructor() {
        chairperson = msg.sender;
    }

    function addProposal(string memory _name) public onlyAdministrator {
        proposals.push(Proposal({
            name: _name,
            votesCount: 0
        }));
        emit ProposalAdded(_name);
    }

    function resetVotes() public onlyAdministrator {
        for (uint i = 0; i < proposals.length; i++) {
            proposals[i].votesCount = 0;
        }
        votingRound++;
        // Resetear el estado de votación de todos los votantes
        for (uint i = 0; i < voterAddresses.length; i++) {
            voters[voterAddresses[i]].voted = false;
        }
        emit VotingReset(votingRound);
    }

    function setVotingStatus(bool status) public onlyAdministrator {
        votingOpen = status;
        emit VotingStatusChanged(status);
    }

    function clearProposals() public onlyAdministrator {
        delete proposals;
        votingRound++;
        // Resetear el estado de votación de todos los votantes
        for (uint i = 0; i < voterAddresses.length; i++) {
            voters[voterAddresses[i]].voted = false;
        }
        delete voterAddresses;
        emit ProposalsCleared();
    }

    function getInfoProposals() public view returns (Proposal[] memory) {
        return proposals;
    }

    function getChairPerson() public view returns (address) {
        return chairperson;
    }

    function vote(uint32 index) public onlyUsersNotVotedYet {
        require(index < proposals.length, "Indice de propuesta invalido");
        Voter storage sender = voters[msg.sender];
        proposals[index].votesCount += 1;
        sender.voted = true;
        sender.vote = index;
        sender.votingRound = votingRound;
        
        // Solo agregar la dirección si no está ya en la lista
        bool addressExists = false;
        for (uint i = 0; i < voterAddresses.length; i++) {
            if (voterAddresses[i] == msg.sender) {
                addressExists = true;
                break;
            }
        }
        if (!addressExists) {
            voterAddresses.push(msg.sender);
        }
        
        emit VoteCast(msg.sender, index);
    }

    function getVotesById(uint index) public view returns(uint256) {
        require(index < proposals.length, "Indice de propuesta invalido");
        return proposals[index].votesCount;
    }

    function getVoterAddresses() public view onlyAdministrator returns (address[] memory) {
        return voterAddresses;
    }
}