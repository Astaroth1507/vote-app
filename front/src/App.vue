<template lang="pug">
  #app
    section.hero.hero-muni-fraijanes

      .hero-head
        nav.navbar
          .container
            #navbarMenuHeroA.navbar-menu.is-active
              .navbar-end
                span.navbar-item
                  b-button(type="is-success" v-if="isLogged") Conectado
                  a.button.is-primary.is-inverted(@click="connect" v-if="!isLogged")
                    span.icon.icon-wallet-connect
                      font-awesome-icon(icon="wallet")
                    span Conectar
      

    .container.main-title-container
      h1.main-title Sistema de votación electrónica Municipalidad de Fraijanes
      
    .container.mt-16.principal-container
      .columns
        .column.is-10.is-offset-1
          b-message.vote-warning-message(type="is-warning" v-if="voteInfo.voted") Ya has votado
          
          // Formulario para agregar propuestas, visible solo para el administrador
          .add-proposal(v-if="isAdmin")
            b-field.label.add-proposal-label="Agregar Propuesta"
              b-input.input-proposal(v-model="name" placeholder="Escribe el nombre de la propuesta aquí")
            .button-container  
              b-button.add-proposal-button(type="is-success" @click="addProposal") Agregar Propuesta

          // Proposals grid en formato de tarjeta
          .grid-container
            .grid-item(v-for="(proposal, index) in proposals" :key="index")
              .card
                .card-image
                  figure.image.is-128x128
                    font-awesome-icon(icon="user" size="5x")
                .card-content
                  .media
                    .media-content.has-text-centered
                      p.title.is-4 {{ proposal.name }}
                      
                      b-button(type='is-primary' @click="vote(index)" :disabled="voteInfo.voted" v-if="!isAdmin") Votar 

          // Resultados visibles solo para el administrador
          .vote-results(v-if="isAdmin")
            h2.bold-title Resultados
            b-table.result-table(:data='proposals')
              b-table-column(field="name" label="Nombre" v-slot="props") {{props.row.name}}
              b-table-column(field="votes" :centered="true" label="Votos" v-slot="props") {{props.row.votesCount}}
            
            // Contenedor para los botones de administración
            .admin-buttons-container
              b-button.admin-button(type="is-warning" @click="resetVotes") Reiniciar Votación
              b-button.admin-button(type="is-danger" @click="clearProposals") Eliminar Propuestas

      footer.footer
        .content.has-text-centered
          p © 2024 Municipalidad de Fraijanes. Todos los derechos reservados.

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
/* ===========================
  Estilos base
=========================== */
.page-container {
  padding: 0 1.5rem;
  max-width: 100%;
}

.main-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 0;
}

.full-width {
  width: 100%;
  margin: 0;
  padding: 0;
}

/* ===========================
  Estilos de la seccion principal
=========================== */
.hero.hero-muni-fraijanes {
  background: linear-gradient(to right, green 33.33%, white 33.33%, white 66.66%, red 66.66%);
  min-height: 10vh;
  position: relative;
}

.hero-content {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.logo-muni-fraijanes {
  width: 120px;
  height: auto;
  margin: 1rem auto;
}

/* ===========================
   Estilos del input y el form
=========================== */
.field {
  margin: 1rem auto;
  max-width: calc(100% - 2rem);
}

.input-proposal {
  max-width: 100%;
  margin: 0.5rem auto;
}

/* ===========================
  Estilos de la tabla
=========================== */
.table-container {
  margin: 1.5rem auto;
  padding: 0 1rem;
  width: calc(100% - 2rem);
  overflow-x: auto;
}

.b-table {
  min-width: calc(100% - 2rem);
  margin: 0 auto;
}

:deep(.table td), :deep(.table th) {
  padding: 0.75rem 1rem;
}

:deep(.b-table .table-mobile-cards) {
  margin: 1rem auto;
}

:deep(.b-table .table-mobile-cards td) {
  padding: 1rem;
}

/* ===========================
   Estilos del navbar
=========================== */
.navbar {
  background: transparent;
}

.navbar-menu {
  background: transparent;
}

.nav-button {
  margin: 0.5rem;
  min-width: 120px;
}

.account-number {
  color: white;
  word-break: break-all;
  font-size: 0.9rem;
  padding: 0 1rem;
}

/* ===========================
   Estilos del titulo principal
=========================== */
.main-title {
  font-size: clamp(1.5rem, 4vw, 2rem);
  text-align: center;
  color: black;
  font-weight: bold;
  margin: 2rem 1rem;
}

/* ===========================
   Estilos de contenido de secciones
=========================== */
.content-wrapper {
  padding: 0 1rem;
}

.admin-section {
  margin: 2rem auto;
  padding: 0 1rem;
}

/* ===========================
   Estilos de los botones
=========================== */
.button-wrapper {
  padding: 0.5rem;
  display: flex;
  justify-content: center;
  margin: 0.5rem auto;
}

.add-proposal-button,
.vote-button,
.admin-button,
.connect-wallet-btn {
  min-width: 160px;
  max-width: 100%;
  margin: 0.5rem;
  width: 100%;
  max-width: 300px;
}

/* ===========================
   Estilos del grid de propuestas
=========================== */
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 25px;
}

.proposals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
  margin: 0 auto;
}

.proposal-card {
  height: 100%;
}

.card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s;
  margin: 0.5rem;
}

.card:hover {
  transform: translateY(-5px);
}

.card-content {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
}

.proposal-image {
  object-fit: cover;
  border-radius: 4px;
}

/* ===========================
   Seccion de administrador
=========================== */
.section-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 1rem;
  padding: 0 1rem;
}

.admin-buttons-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin: 1.5rem auto;
  padding: 0 1rem;
}

/* ===========================
  Mensaje de alerta
=========================== */
.vote-warning-message {
  margin: 2rem 1rem;
}

.bold-title {
  font-weight: bold;
  padding: 5px 15px;
  margin-top: 5rem;

}

/* ===========================
   Estilos comunes de los botones
=========================== */
.button {
  height: auto;
  white-space: normal;
  padding: 0.5rem 1rem;
  line-height: 1.2;
}

.button-container {
  display: flex;
  justify-content: center;
  width: 100%;
  margin: 1rem 0;
}

/* ===========================
   Estilo del contenedor de alerta
=========================== */
:deep(.message) {
  margin: 1rem;
}

:deep(.message-body) {
  padding: 1.25rem;
}

/* ===========================
   Media Queries
=========================== */

/* Estilos en celulares */
@media screen and (max-width: 768px) {

  .navbar-end {
    flex-direction: row;
    justify-content: flex-end;
    width: 100%;
  }
  .navbar-item {
    width: auto;
  }

  .navbar-menu.is-active {
    position: absolute;
    width: 100%;
    background-color: rgba(0, 0, 0, 0.9);
    padding: 1rem;
    z-index: 100;
  }

  .navbar-menu.is-active .navbar-item {
    color: white;
    text-align: center;
    width: 100%;
    padding: 0.5rem;
  }
  
  /* Botón de conectar billetera en móvil */
  .button.is-primary {
    width: 100%;
    margin: 0.5rem 0;
  }
  .hero.hero-muni-fraijanes {
    min-height: 10vh;
  }

  .logo-muni-fraijanes {
    width: 80px;
  }
  
  .grid-container {
    grid-template-columns: 1fr;
    gap: 25px;
  }

  .navbar-menu.is-active {
    background: rgba(0, 0, 0, 0.8);
    position: absolute;
    width: 100%;
  }

  .connect-text {
    font-size: 0.9rem;
  }

  .proposals-grid {
    grid-template-columns: 1fr;
    padding: 1rem 0.5rem;
  }

  .admin-buttons-container {
    flex-direction: column;
    align-items: center;
    padding: 0 0.5rem;
  }

  .button-wrapper {
    width: 100%;
    max-width: 300px;
  }

  .table-container {
    margin: 1rem 0.5rem;
    padding: 0 0.5rem;
  }

  .field {
    margin: 1rem 0.5rem;
  }

  .navbar-menu.is-active {
    position: absolute;
    width: fit-content;
    background-color: transparent;
    padding: 0rem;
    z-index: 100;
    box-shadow: none;
  }

  .navbar-menu.is-active .navbar-item {
    color: white;
    text-align: center;
    padding: 0;
  }

  .admin-buttons-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .admin-button {
    margin: 0.5rem 0;
  }
}

/* Estilos en tablets */
@media screen and (min-width: 769px) and (max-width: 1023px) {
  .proposals-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .button.is-primary {
    width: 100%;
  }

  .button-wrapper {
    max-width: 250px;
  }
}

/* Estilos escritorio */
@media screen and (min-width: 1024px) {
  .admin-buttons-container {
    justify-content: flex-start;
  }

  .table-container {
    margin: 2rem auto;
  }
}

.navbar-menu.is-active {
  display: block; /* Asegura que el menú sea visible cuando está activo */
  padding: 0;
}

.navbar-end .navbar-item {
  width: 100%; /* Asegura que el botón ocupe todo el ancho en móvil */
  display: flex;
  justify-content: center;
}

.image.is-128x128{
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-menu {
  flex-grow: 1;
  display: flex;
  justify-content: flex-end; /* Sitúa los elementos a la derecha */
}

.navbar-end {
  display: flex;
  align-items: center;
}

.navbar-end .navbar-item {
  white-space: pre-wrap; /* Permite salto de línea si la cuenta es larga */
  text-align: right; /* Asegura que el contenido esté alineado a la derecha */
}

#navbarMenuHeroA.navbar-menu.is-active {
  position: fixed;
  bottom: 10px;
  right: 15px;
}

.footer{
  background-color: aliceblue;
  width: 100%;
}
 #app{
  display: grid;
  min-height: 100dvh;
  grid-template-rows:auto 1fr auto ;
  width: 100%;
 }

 .container.mt-16.principal-container{
  width: 100%;
  max-width: 100%;
 }
</style>


