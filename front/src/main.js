import Vue from 'vue'
import App from './App.vue'
import Buefy from 'buefy'
import 'buefy/dist/buefy.css'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faWallet, faUser } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import store from "./store"

// Agrega los íconos que necesitas de FontAwesome a la biblioteca
library.add(faWallet, faUser)

// Configura Buefy para usar FontAwesome como el paquete de íconos
Vue.use(Buefy, {
  defaultIconPack: 'fas'  // Especifica 'fas' para FontAwesome
})

// Registra el componente de FontAwesome para usarlo en toda la app
Vue.component('font-awesome-icon', FontAwesomeIcon)

Vue.config.productionTip = false

new Vue({
  store,
  render: h => h(App),
}).$mount('#app')
