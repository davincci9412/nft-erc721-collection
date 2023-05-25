import NetworkConfigInterface from '../lib/NetworkConfigInterface';
import MarketplaceConfigInterface from '../lib/MarketplaceConfigInterface';

interface SaleConfig {
  price: number;
  maxMintAmountPerTx: number;
  maxMintAmountPerWallet: number;
};

export default interface CollectionConfigInterface {
  testnet: NetworkConfigInterface;
  mainnet: NetworkConfigInterface;
  contractName: string;
  tokenName: string;
  tokenSymbol: string;
  hiddenMetadataUri: string;
  maxSupply: number;
  whitelistSale1: SaleConfig;
  whitelistSale2: SaleConfig;
  preSale: SaleConfig;
  publicSale: SaleConfig;
  contractAddress: string|null;
  marketplaceIdentifier: string;
  marketplaceConfig: MarketplaceConfigInterface;
  whitelist1Addresses: string[];
  whitelist2Addresses: string[];
};
