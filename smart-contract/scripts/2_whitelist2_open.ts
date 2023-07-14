import { utils } from 'ethers';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import CollectionConfig from './../config/CollectionConfig';
import NftContractProvider from '../lib/NftContractProvider';

async function main() {
  // Check configuration
  if (CollectionConfig.whitelist2Addresses.length < 1) {
    throw '\x1b[31merror\x1b[0m ' + 'The whitelist2 is empty, please add some addresses to the configuration.';
  }

  // Build the Merkle Tree
  const leafNodes = CollectionConfig.whitelist2Addresses.map(addr => keccak256(addr));
  const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
  const rootHash = '0x' + merkleTree.getRoot().toString('hex');

  // Attach to deployed contract
  const contract = await NftContractProvider.getContract();

  // Update sale price (if needed)
  const whitelistPrice = utils.parseEther(CollectionConfig.whitelistSale2.price.toString());
  if (!await (await contract.cost2()).eq(whitelistPrice)) {
    console.log(`Updating the token price to ${CollectionConfig.whitelistSale2.price} ${CollectionConfig.mainnet.symbol}...`);

    await (await contract.setCost2(whitelistPrice)).wait();
  }

  // Update max amount per TX (if needed)
  if (!await (await contract.maxMintAmountPerTx2()).eq(CollectionConfig.whitelistSale2.maxMintAmountPerTx)) {
    console.log(`Updating the max mint amount per TX to ${CollectionConfig.whitelistSale2.maxMintAmountPerTx}...`);

    await (await contract.setMaxMintAmountPerTx2(CollectionConfig.whitelistSale2.maxMintAmountPerTx)).wait();
  }

  // Update root hash (if changed)
  if ((await contract.merkleRootForWL2()) !== rootHash) {
    console.log(`Updating the root hash to: ${rootHash}`);

    await (await contract.setMerkleRootForWL2(rootHash)).wait();
  }
  
  // Enable whitelist sale (if needed)
  if (!await contract.whitelistMintEnabled2()) {
    console.log('Enabling whitelist2 sale...');

    await (await contract.setWhitelistMintEnabled2(true)).wait();
  }

  console.log('Whitelist2 sale has been enabled!');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
