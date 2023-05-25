import { utils } from 'ethers';
import CollectionConfig from './CollectionConfig';

// Update the following array if you change the constructor arguments...

const ContractArguments = [
  CollectionConfig.tokenName,
  CollectionConfig.tokenSymbol,
  utils.parseEther(CollectionConfig.whitelistSale1.price.toString()),
  utils.parseEther(CollectionConfig.whitelistSale2.price.toString()),
  CollectionConfig.maxSupply,
  CollectionConfig.whitelistSale1.maxMintAmountPerTx,
  CollectionConfig.whitelistSale1.maxMintAmountPerWallet,
  CollectionConfig.whitelistSale2.maxMintAmountPerTx,
  CollectionConfig.whitelistSale2.maxMintAmountPerWallet,
  CollectionConfig.hiddenMetadataUri,
] as const;

export default ContractArguments;