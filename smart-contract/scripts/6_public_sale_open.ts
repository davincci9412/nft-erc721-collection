import { utils } from 'ethers';
import CollectionConfig from './../config/CollectionConfig';
import NftContractProvider from '../lib/NftContractProvider';

async function main() {
  // Attach to deployed contract
  const contract = await NftContractProvider.getContract();

  if (await contract.whitelistMintEnabled1()) {
    throw '\x1b[31merror\x1b[0m ' + 'Please close the whitelist sale before opening a public sale.';
  }

  // Update sale price (if needed)
  const publicSalePrice = utils.parseEther(CollectionConfig.publicSale.price.toString());
  if (!await (await contract.cost1()).eq(publicSalePrice)) {
    console.log(`Updating the token price to ${CollectionConfig.publicSale.price} ${CollectionConfig.mainnet.symbol}...`);

    await (await contract.setCost1(publicSalePrice)).wait();
  }

  // Update max amount per TX (if needed)
  if (!await (await contract.maxMintAmountPerTx1()).eq(CollectionConfig.publicSale.maxMintAmountPerTx)) {
    console.log(`Updating the max mint amount per TX to ${CollectionConfig.publicSale.maxMintAmountPerTx}...`);

    await (await contract.setMaxMintAmountPerTx1(CollectionConfig.publicSale.maxMintAmountPerTx)).wait();
  }
  
  // Unpause the contract (if needed)
  if (await contract.paused()) {
    console.log('Unpausing the contract...');

    await (await contract.setPaused(false)).wait();
  }

  console.log('Public sale is now open!');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
