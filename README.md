# Proyecto de Votación Electrónica Basado en Blockchain

# Descripción

Este proyecto es un sistema de votación electrónica que utiliza la tecnología blockchain para garantizar la transparencia, seguridad e integridad de los votos. Con este sistema, se busca asegurar que solo los usuarios autorizados puedan votar y que los resultados de la votación sean inmutables y verificables.

# Tecnologías Utilizadas

Frontend: Vue.js y Vuex para la construcción de una interfaz interactiva y la gestión del estado global de la aplicación.

Blockchain: Ethereum, usando contratos inteligentes en Solidity para manejar los votos de manera segura y transparente.

Biblioteca para Blockchain: Ethers.js para interactuar con los contratos inteligentes desde el frontend.

Herramienta de Desarrollo: Hardhat para la compilación, pruebas y despliegue del contrato en la red de prueba Sepolia.

Red de Pruebas: Sepolia, una red de pruebas de Ethereum.

Lenguaje de Programación para Contratos: Solidity.

# Funcionalidades

Registro de Propuestas: Permite agregar propuestas que los usuarios pueden votar. Solo el administrador puede agregar y eliminar propuestas.

Votación de Usuarios: Cada usuario registrado puede emitir un voto por ronda de votación. La aplicación controla que el usuario no haya votado previamente.

Gestión de Rondas de Votación: El administrador puede abrir y cerrar rondas de votación, así como resetear los votos para iniciar una nueva ronda.

Transparencia de Resultados: Los resultados de la votación están disponibles en la blockchain, asegurando su transparencia y accesibilidad.

Eventos y Rastreabilidad: Emisión de eventos clave (como la emisión de votos y la adición de propuestas) para facilitar el seguimiento de las actividades en tiempo real.
