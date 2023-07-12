import CollectionConfigInterface from '../lib/CollectionConfigInterface';
import * as Networks from '../lib/Networks';
import * as Marketplaces from '../lib/Marketplaces';
import whitelist1Addresses from './whitelist1.json';
import whitelist2Addresses from './whitelist2.json';

const CollectionConfig: CollectionConfigInterface = {
  testnet: Networks.ethereumTestnet,
  mainnet: Networks.ethereumMainnet,
  // The contract name can be updated using the following command:
  // yarn rename-contract NEW_CONTRACT_NAME
  // Please DO NOT change it manually!
  contractName: 'YourNftToken',
  tokenName: 'My NFT Token',
  tokenSymbol: 'MNT',
  hiddenMetadataUri: 'ipfs://__CID__/hidden.json',
  maxSupply: 10000,
  whitelistSale1: {
    price: 0.05,
    maxMintAmountPerTx: 1,
    maxMintAmountPerWallet: 1,
  },
  whitelistSale2: {
    price: 0.05,
    maxMintAmountPerTx: 1,
    maxMintAmountPerWallet: 1,
  },
  preSale: {
    price: 0.07,
    maxMintAmountPerTx: 2,
    maxMintAmountPerWallet: 2,
  },
  publicSale: {
    price: 0.09,
    maxMintAmountPerTx: 5,
    maxMintAmountPerWallet: 5,
  },
  contractAddress: "0xdFd9e8b94e19112e4AF3bbc9e231B41a7012e30C",
  marketplaceIdentifier: 'my-nft-token',
  marketplaceConfig: Marketplaces.openSea,
  whitelist1Addresses,
  whitelist2Addresses,
};

export default CollectionConfig;
