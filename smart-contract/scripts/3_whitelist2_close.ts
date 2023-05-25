import NftContractProvider from '../lib/NftContractProvider';

async function main() {
  // Attach to deployed contract
  const contract = await NftContractProvider.getContract();
  
  // Disable whitelist sale (if needed)
  if (await contract.whitelistMintEnabled2()) {
    console.log('Disabling whitelist2 sale...');

    await (await contract.setWhitelistMintEnabled2(false)).wait();
  }

  console.log('Whitelist2 sale has been disabled!');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
