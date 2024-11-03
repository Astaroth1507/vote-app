async function deploy() {
  // Obtenemos el contrato que será desplegado, lo llamamos como en el .sol
  const Vote = await hre.ethers.getContractFactory("Vote");
  
  // Aquí desplegamos el contrato
  const vote = await Vote.deploy();
  
  // No necesitas esperar por `.deployed()` en ethers v6
  console.log("El contrato fue desplegado en la siguiente dirección: ", vote.target); // 'target' en ethers v6 es equivalente a 'address' en ethers v5
}

// Manejo de errores y ejecución del despliegue
deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
