const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vote contract", function () {
  let Vote;
  let vote;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    Vote = await ethers.getContractFactory("Vote");
    [owner, addr1, addr2] = await ethers.getSigners();
    vote = await Vote.deploy();
  });

  describe("Deploy", function () {
    it("should set the chairperson as the admin", async function () {
      expect(await vote.getChairPerson()).to.equal(owner.address);
    });
  });

  describe("Adding proposals", function () {
    it("should return 1 proposal after adding one", async function () {
      const addProposalTx = await vote.addProposal("Moises");
      await addProposalTx.wait();
      expect((await vote.getInfoProposals()).length).to.equal(1);
    });

    it("should not allow non-admin to add a proposal", async function () {
      await expect(vote.connect(addr1).addProposal("Alexander"))
        .to.be.revertedWith("unicamente el administrador puede agregar candidatos");
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      await vote.addProposal("test1");
      await vote.addProposal("test2");
      await vote.addProposal("test3");
      await vote.connect(addr1).vote(1);
    });

    it("should add a vote to the first proposal", async function () {
      await vote.connect(addr2).vote(0);
      expect(await vote.getVotesById(0)).to.equal(1);
    });

    it("should not allow double voting by the same user in the same round", async function () {
      await expect(vote.connect(addr1).vote(0))
        .to.be.revertedWith("Ya has enviado tu voto en esta ronda");
    });

    it("should prevent voting when voting is closed", async function () {
      await vote.setVotingStatus(false);
      await expect(vote.connect(addr2).vote(1))
        .to.be.revertedWith("La votacion esta cerrada.");
    });
  });

  describe("Voting reset and round management", function () {
    beforeEach(async function () {
      await vote.addProposal("test1");
      await vote.addProposal("test2");
      await vote.addProposal("test3");
      await vote.connect(addr1).vote(1);
    });

    it("should reset votes and allow voting again after reset", async function () {
      // Verificar el voto inicial
      expect(await vote.getVotesById(1)).to.equal(1);
      
      // Resetear votos
      await vote.resetVotes();
      
      // Verificar que los votos se resetearon
      expect(await vote.getVotesById(1)).to.equal(0);
      
      // Verificar que el mismo usuario puede votar de nuevo
      await vote.connect(addr1).vote(2);
      expect(await vote.getVotesById(2)).to.equal(1);
    });

    it("should increase votingRound after reset", async function () {
      const initialRound = await vote.votingRound();
      await vote.resetVotes();
      const newRound = await vote.votingRound();
      expect(newRound).to.equal(initialRound + BigInt(1));
    });

    it("should allow voting again after clearing proposals", async function () {
      // Verificar voto inicial
      expect(await vote.getVotesById(1)).to.equal(1);
      
      // Limpiar propuestas
      await vote.clearProposals();
      
      // Verificar que no hay propuestas
      expect((await vote.getInfoProposals()).length).to.equal(0);
      
      // Agregar nueva propuesta
      await vote.addProposal("New Proposal");
      
      // Verificar que el mismo usuario puede votar de nuevo
      await vote.connect(addr1).vote(0);
      
      // Verificar que el voto se registró
      expect(await vote.getVotesById(0)).to.equal(1);
    });
  });

  describe("Voting status management", function () {
    it("should allow admin to open and close voting", async function () {
      await vote.setVotingStatus(false);
      expect(await vote.votingOpen()).to.be.false;
      await vote.setVotingStatus(true);
      expect(await vote.votingOpen()).to.be.true;
    });

    it("should prevent non-admin from changing voting status", async function () {
      await expect(vote.connect(addr1).setVotingStatus(false))
        .to.be.revertedWith("unicamente el administrador puede agregar candidatos");
    });
  });

  describe("Proposal information", function () {
    it("should return all proposals information", async function () {
      await vote.addProposal("Proposal 1");
      await vote.addProposal("Proposal 2");
      const proposals = await vote.getInfoProposals();
      expect(proposals.length).to.equal(2);
      expect(proposals[0].name).to.equal("Proposal 1");
      expect(proposals[1].name).to.equal("Proposal 2");
    });
  });

  // Nuevos tests adicionales para verificar comportamiento específico
  describe("Additional voting scenarios", function () {
    it("should allow multiple rounds of voting after resets", async function () {
      await vote.addProposal("Proposal 1");
      
      // Primera ronda
      await vote.connect(addr1).vote(0);
      expect(await vote.getVotesById(0)).to.equal(1);
      
      // Reset y segunda ronda
      await vote.resetVotes();
      await vote.connect(addr1).vote(0);
      expect(await vote.getVotesById(0)).to.equal(1);
      
      // Reset y tercera ronda
      await vote.resetVotes();
      await vote.connect(addr1).vote(0);
      expect(await vote.getVotesById(0)).to.equal(1);
    });

    it("should handle multiple voters across multiple rounds", async function () {
      await vote.addProposal("Proposal 1");
      
      // Primera ronda
      await vote.connect(addr1).vote(0);
      await vote.connect(addr2).vote(0);
      expect(await vote.getVotesById(0)).to.equal(2);
      
      // Reset y segunda ronda
      await vote.resetVotes();
      await vote.connect(addr1).vote(0);
      await vote.connect(addr2).vote(0);
      expect(await vote.getVotesById(0)).to.equal(2);
    });
  });
});