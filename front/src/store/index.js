import Vue from "vue";
import Vuex from "vuex";
import { ethers } from "ethers";
import Vote from "../utils/vote.json";

Vue.use(Vuex);

const transformProposalData = (characterData) => {
  return {
    name: characterData.name,
    votesCount: characterData.votesCount.toNumber(),
  };
};

export default new Vuex.Store({
  state: {
    account: null,
    error: null,
    mining: false,
    voteInfo: {},
    proposals: [],
    contract_address: "0x9dE0ea64B58ce932581cD1Cc0c6132687b2283b3",  // Dirección del contrato
  },
  getters: {
    account: (state) => state.account,
    voteInfo: (state) => state.voteInfo,
    proposals: (state) => state.proposals,
  },
  mutations: {
    setAccount(state, account) {
      state.account = account;
    },
    setError(state, error) {
      state.error = error;
    },
    setProposals(state, proposals) {
      state.proposals = proposals;
    },
    setVoteInfo(state, voteInfo) {
      state.voteInfo = voteInfo;
    },
    setChairperson(state, chairperson) {
      console.log("Guardando chairperson en el estado:", chairperson);
      state.voteInfo.chairperson = chairperson;
    },
    setMining(state, mining) {
      state.mining = mining;
    },
  },
  actions: {
    async connect({ commit, dispatch }, connect) {
      try {
        const { ethereum } = window;
        if (!ethereum) {
          commit("setError", "Metamask no está instalado!");
          return;
        }
        if (!(await dispatch("checkIfConnected")) && connect) {
          await dispatch("requestAccess");
        }
        await dispatch("checkNetwork");
      } catch (error) {
        console.log(error);
        commit("setError", "Error al solicitar cuenta.");
      }
    },
    async checkIfConnected({ commit }) {
      const { ethereum } = window;
      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length !== 0) {
        commit("setAccount", accounts[0]);
        return 1;
      } else {
        return 0;
      }
    },
    async checkNetwork({ commit, dispatch }) {
      const { ethereum } = window;
      let chainId = await ethereum.request({ method: "eth_chainId" });
      const sepoliaChainId = "0xaa36a7";  // ID de la red Sepolia
      if (chainId !== sepoliaChainId) {
        if (!(await dispatch("switchNetwork"))) {
          commit("setError", "No estás conectado a la red de prueba Sepolia.");
        }
      }
    },
    async switchNetwork() {
      const { ethereum } = window;
      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xaa36a7" }],
        });
        return 1;
      } catch (switchError) {
        return 0;
      }
    },
    async requestAccess({ commit }) {
      const { ethereum } = window;
      try {
        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });
        commit("setAccount", accounts[0]);
      } catch (error) {
        commit("setError", "Acceso denegado por el usuario");
      }
    },
    async getContract({ state }) {
      try {
        const { ethereum } = window;
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          state.contract_address,
          Vote.abi,
          signer
        );

        console.log("Funciones disponibles en el contrato:", Object.keys(connectedContract.functions));
        return connectedContract;
      } catch (error) {
        console.log("Error conectando con el contrato:", error);
        return null;
      }
    },
    async vote({ dispatch }, index) {
      try {
        const connectedContract = await dispatch("getContract");
        if (!connectedContract) throw new Error("Error en la conexión al contrato");

        await connectedContract.vote(index);
        return { isError: false };
      } catch (error) {
        console.error("Error al votar:", error);
        return { isError: true, msg: error.message || "Ya has votado" };
      }
    },
    async resetVotes({ commit, dispatch }) {
      try {
        commit("setMining", true);
        const connectedContract = await dispatch("getContract");
        if (!connectedContract) throw new Error("No se pudo conectar con el contrato.");

        const tx = await connectedContract.resetVotes();
        await tx.wait();
        console.log("Votos reiniciados con éxito");
        return { isError: false };
      } catch (error) {
        console.log("Error al reiniciar los votos:", error);
        return { isError: true, msg: "No se pudo reiniciar los votos." };
      } finally {
        commit("setMining", false);
      }
    },
    async setVotingStatus({ dispatch }, status) {
      try {
        const connectedContract = await dispatch("getContract");
        const transaction = await connectedContract.setVotingStatus(status);
        await transaction.wait();
        return { isError: false };
      } catch (error) {
        console.log("Error al cambiar el estado de la votación:", error);
        return { isError: true, msg: "No se pudo cambiar el estado de la votación." };
      }
    },
    async voteInfo({ dispatch, commit, state }) {
      try {
        const connectedContract = await dispatch("getContract");
        const charactersTxn = await connectedContract.voters(state.account);
        const voteInfo = {
          vote: charactersTxn.vote.toNumber(),
          voted: charactersTxn.voted,
        };
        commit("setVoteInfo", voteInfo);
      } catch (error) {
        console.log(error);
      }
    },
    async getProposals({ commit, dispatch }) {
      try {
        const connectedContract = await dispatch("getContract");
        const charactersTxn = await connectedContract.getInfoProposals();
        const proposals = charactersTxn.map((characterData) =>
          transformProposalData(characterData)
        );
        commit("setProposals", proposals);
      } catch (error) {
        console.log(error);
      }
    },
    async addProposal({ dispatch }, proposal) {
      try {
        if (!proposal || typeof proposal !== "string") {
          throw new Error("El nombre de la propuesta no puede estar vacío");
        }
        const connectedContract = await dispatch("getContract");
        const mintTxn = await connectedContract.addProposal(proposal);
        await mintTxn.wait();
      } catch (error) {
        console.error("Error al agregar propuesta:", error);
        throw new Error(error.message);
      }
    },
    async getChairperson({ commit, dispatch }) {
      try {
        const connectedContract = await dispatch("getContract");
        const chairperson = await connectedContract.getChairPerson();
        console.log("Administrador obtenido desde el contrato:", chairperson);
        commit("setChairperson", chairperson);
      } catch (error) {
        console.log("Error obteniendo el administrador:", error);
      }
    },
    async clearProposals({ commit, dispatch }) {
      try {
        commit("setMining", true);
        const connectedContract = await dispatch("getContract");
        const tx = await connectedContract.clearProposals();
        await tx.wait();
        console.log("Propuestas eliminadas con éxito");
        return { isError: false, msg: "Propuestas eliminadas exitosamente" };
      } catch (error) {
        console.error("Error al eliminar propuestas:", error);
        return { isError: true, msg: error.message };
      } finally {
        commit("setMining", false);
      }
    },
  },
});
