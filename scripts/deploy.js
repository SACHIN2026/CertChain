async function main() {
  console.log("Deploying CertificateRegistry contract...");

  const CertificateRegistry = await ethers.getContractFactory('CertificateRegistry');
  const registry = await CertificateRegistry.deploy();
  
  await registry.waitForDeployment();
  
  const contractAddress = await registry.getAddress();
  console.log('CertificateRegistry deployed to:', contractAddress);
  
  console.log("\n==================================================");
  console.log("IMPORTANT: Save this contract address!");
  console.log("Contract Address:", contractAddress);
  console.log("==================================================");
  console.log("\nNext steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Update frontend/.env file with VITE_CONTRACT_ADDRESS");
  console.log("3. Copy artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json to frontend/src/");
  console.log("\nVerify on Etherscan (if on Sepolia):");
  console.log(`npx hardhat verify --network sepolia ${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
