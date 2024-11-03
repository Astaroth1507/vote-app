<template lang="pug">
  #app
    section.hero.hero-muni-fraijanes
      img.logo-muni-fraijanes(src="https://yt3.googleusercontent.com/ytc/AIdro_mmcuuma3Zh1DobRxnqfW2_mAo_jGgG1uLzUfkIMMtHwQE=s900-c-k-c0x00ffffff-no-rj" alt="logo image")

      .hero-head
        nav.navbar
          .container
            .navbar-brand
              p.navbar-item.color-text
                span
              span.navbar-burger(data-target='navbarMenuHeroA')
                span
                span
                span
            #navbarMenuHeroA.navbar-menu
              .navbar-end
                span.navbar-item
                  span {{account}}
                span.navbar-item(v-if="!isLogged")
                  a.button.is-primary.is-inverted(@click="connect")
                    span.icon
                      font-awesome-icon(icon="wallet")
                    span Connect Wallet
      .hero-body
        .container.has-text-centered
          p.title.principal-title
            | Sistema de votacion electronica Municipalidad de Fraijanes
    .container.mt-16
      .columns
        .column.is-10.is-offset-1
          b-message.vote-warning-message(type="is-warning" v-if="voteInfo.voted") Ya has votado
          
          // Formulario para agregar propuestas, visible solo para el administrador
          .add-proposal(v-if="isAdmin")
            h2 Agregar Propuesta
            b-field.label="Nombre de la propuesta"
              b-input(v-model="name" placeholder="Escribe el nombre de la propuesta aquí")
            b-button(type="is-primary" @click="addProposal") Agregar Propuesta

            // Botón para resetear la votación
            b-button(type="is-danger" @click="resetVotes") Reiniciar Votación

            // Botón para eliminar todas las propuestas
            b-button(type="is-danger" @click="clearProposals") Eliminar Propuestas

          // Proposals grid en formato de tarjeta
          .grid-container
            .grid-item(v-for="(proposal, index) in proposals" :key="index")
              .card
                .card-image
                  figure.image.is-128x128
                    img(src="https://www.flaticon.es/icono-gratis/persona_6532018" alt="Proposal image")
                .card-content
                  .media
                    .media-content.has-text-centered
                      p.title.is-4 {{ proposal.name }}
                      
                  b-button(type='is-primary' @click="vote(index)" :disabled="voteInfo.voted") Votar

          // Resultados visibles solo para el administrador
          .vote-results(v-if="isAdmin")
            h2 Resultados
            b-table(:data='proposals')
              b-table-column(field="name" label="Nombre" v-slot="props") {{props.row.name}}
              b-table-column(field="votes" :centered="true" label="Votos" v-slot="props") {{props.row.votesCount}}
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      name: "",
      localChairperson: null,
    }
  },
  async mounted() {
    await this.$store.dispatch("connect", true);
    await this.$store.dispatch("getChairperson");
    await this.$store.dispatch("getProposals");
    await this.$store.dispatch("voteInfo");
    
    this.localChairperson = this.$store.state.voteInfo.chairperson;

    console.log("Cuenta conectada:", this.account);
    console.log("Administrador guardado en el estado después de obtener:", this.localChairperson);
    console.log("¿Es administrador?", this.isAdmin);
  },
  computed: {
    voteInfo() {
      return this.$store.getters.voteInfo;
    },
    account() {
      return this.$store.getters.account;
    },
    isLogged() {
      return this.$store.getters.account !== null;
    },
    proposals() {
      return this.$store.getters.proposals;
    },
    isAdmin() {
      return (
        this.account &&
        this.account.toLowerCase() === "0xa70dc59ba0c6371021dfcd59fc5dcdb962fe6d57"
      );
    },
    votingOpen() {
      return this.$store.state.voteInfo.votingOpen;
    }
  },
  watch: {
    'this.$store.state.voteInfo.chairperson': {
      handler(newVal) {
        console.log("Nuevo valor de chairperson detectado:", newVal);
        this.localChairperson = newVal;
      },
      immediate: true
    }
  },
  methods: {
    showErrorToast(message) {
      this.$buefy.toast.open({
        message,
        type: 'is-danger'
      });
    },
    async connect() {
      await this.$store.dispatch("connect", 1);
    },
    async addProposal() {
      if (!this.name.trim()) {
        this.showErrorToast("Por favor ingrese un nombre para la propuesta");
        return;
      }
      
      try {
        await this.$store.dispatch("addProposal", this.name);
        await this.$store.dispatch("getProposals");
        this.name = ""; // Limpiar el input después de agregar
        this.$buefy.toast.open({
          message: "Propuesta agregada exitosamente",
          type: 'is-success'
        });
      } catch (error) {
        this.showErrorToast("Error al agregar la propuesta: " + error.message);
      }
    },
    async vote(index) {
      if (index < 0 || index >= this.proposals.length) {
        this.showErrorToast("Índice de propuesta inválido");
        return;
      }

      try {
        const res = await this.$store.dispatch("vote", index);
        if (res.isError) {
          this.showErrorToast(res.msg);
        } else {
          this.$buefy.toast.open({
            message: "Voto registrado exitosamente",
            type: 'is-success'
          });
          await this.$store.dispatch("voteInfo");
          await this.$store.dispatch("getProposals");
        }
      } catch (error) {
        this.showErrorToast("Error al votar: " + error.message);
      }
    },
    async resetVotes() {
      try {
        const res = await this.$store.dispatch("resetVotes");
        if (res.isError) {
          this.showErrorToast(res.msg);
        } else {
          this.$buefy.toast.open({
            message: "Votación reiniciada exitosamente",
            type: 'is-success'
          });
          await this.$store.dispatch("getProposals");
          await this.$store.dispatch("voteInfo");
        }
      } catch (error) {
        this.showErrorToast("Error al reiniciar la votación: " + error.message);
      }
    },
    async clearProposals() {
      try {
        const res = await this.$store.dispatch("clearProposals");
        if (res.isError) {
          this.showErrorToast(res.msg);
        } else {
          this.$buefy.toast.open({
            message: "Propuestas eliminadas exitosamente",
            type: 'is-success'
          });
          await this.$store.dispatch("getProposals");
          await this.$store.dispatch("voteInfo"); // Actualizar después de eliminar propuestas
        }
      } catch (error) {
        this.showErrorToast("Error al eliminar propuestas: " + error.message);
      }
    },
    async toggleVoting() {
      try {
        const res = await this.$store.dispatch("setVotingStatus", !this.votingOpen);
        if (res.isError) {
          this.showErrorToast(res.msg);
        } else {
          this.$buefy.toast.open({
            message: `Votación ${this.votingOpen ? 'cerrada' : 'abierta'} exitosamente`,
            type: 'is-success'
          });
          await this.$store.dispatch("voteInfo");
        }
      } catch (error) {
        this.showErrorToast("Error al cambiar el estado de la votación: " + error.message);
      }
    }
  }
}
</script>

<style scoped>
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  grid-gap: 20px;
  padding: 20px;
}

.grid-item {
  text-align: center;
}

.card {
  border: 1px solid #ddd;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 2px 2px 12px rgba(0, 0, 0, 0.1);
}

.vote-warning-message {
  margin-top: 40px;
  margin-bottom: 40px;
  background-color: #fff3cd;
  padding: 15px;
  border-radius: 5px;
}

.add-proposal {
  margin-bottom: 20px;
}

.hero.hero-muni-fraijanes {
  background: linear-gradient(to right, green 33.33%, white 33.33%, white 66.66%, red 66.66%);
  height: 100%; 
  width: 100%; 
  position: relative;
}

.logo-muni-fraijanes {
  width: 150px;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.color-text {
  color: white;
}

p.title.principal-title {
  margin-top: 15vh;
}
</style>
