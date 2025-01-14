import fs from 'fs';
import * as dotenv from 'dotenv';
import { HardhatUserConfig, task } from 'hardhat/config';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import CollectionConfig from './config/CollectionConfig';

dotenv.config();

/*
 * If you have issues with stuck transactions or you simply want to invest in
 * higher gas fees in order to make sure your transactions will run smoother
 * and faster, then you can update the followind value.
 * This value is used by default in any network defined in this project, but
 * please make sure to add it manually if you define any custom network.
 * 
 * Example:
 * Setting the value to "1.1" will raise the gas values by 10% compared to the
 * estimated value.
 */
const DEFAULT_GAS_MULTIPLIER: number = 1;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task('generate-root-hash', 'Generates and prints out the root hash for the current whitelist', async () => {
  // Check configuration
  if (CollectionConfig.whitelist1Addresses.length < 1) {
    throw 'The whitelist1 is empty, please add some addresses to the configuration.';
  }
  if (CollectionConfig.whitelist2Addresses.length < 1) {
    throw 'The whitelist2 is empty, please add some addresses to the configuration.';
  }

  // Build the Merkle Tree For WL1
  const leafNodes1 = CollectionConfig.whitelist1Addresses.map(addr => keccak256(addr));
  const merkleTree1 = new MerkleTree(leafNodes1, keccak256, { sortPairs: true });
  const rootHash1 = '0x' + merkleTree1.getRoot().toString('hex');

  console.log('The Merkle Tree root hash for the whitelist1 is: ' + rootHash1 + "\n");

    // Build the Merkle Tree For WL2
    const leafNodes2 = CollectionConfig.whitelist2Addresses.map(addr => keccak256(addr));
    const merkleTree2 = new MerkleTree(leafNodes2, keccak256, { sortPairs: true });
    const rootHash2 = '0x' + merkleTree2.getRoot().toString('hex');
  
    console.log('The Merkle Tree root hash for the whitelist2 is: ' + rootHash2 + "\n");
});

task('generate-proof', 'Generates and prints out the whitelist proof for the given address (compatible with block explorers such as Etherscan)', async (taskArgs: {address: string}) => {
  // Check configuration
  if (CollectionConfig.whitelist1Addresses.length < 1) {
    throw 'The whitelist1 is empty, please add some addresses to the configuration.';
  }
  if (CollectionConfig.whitelist2Addresses.length < 1) {
    throw 'The whitelist1 is empty, please add some addresses to the configuration.';
  }

  // Build the Merkle Tree
  const leafNodes1 = CollectionConfig.whitelist1Addresses.map(addr => keccak256(addr));
  const merkleTree1 = new MerkleTree(leafNodes1, keccak256, { sortPairs: true });
  const proof1 = merkleTree1.getHexProof(keccak256(taskArgs.address)).toString().replace(/'/g, '').replace(/ /g, '');

  console.log('The whitelist1 proof for the given address is: ' + proof1 + "\n");

  const leafNodes2 = CollectionConfig.whitelist2Addresses.map(addr => keccak256(addr));
  const merkleTree2 = new MerkleTree(leafNodes2, keccak256, { sortPairs: true });
  const proof2 = merkleTree2.getHexProof(keccak256(taskArgs.address)).toString().replace(/'/g, '').replace(/ /g, '');

  console.log('The whitelist2 proof for the given address is: ' + proof2 + "\n");

})
.addPositionalParam('address', 'The public address');

task('rename-contract', 'Renames the smart contract replacing all occurrences in source files', async (taskArgs: {newName: string}, hre) => {
  // Validate new name
  if (!/^([A-Z][A-Za-z0-9]+)$/.test(taskArgs.newName)) {
    throw 'The contract name must be in PascalCase: https://en.wikipedia.org/wiki/Camel_case#Variations_and_synonyms';
  }

  const oldContractFile = `${__dirname}/contracts/${CollectionConfig.contractName}.sol`;
  const newContractFile = `${__dirname}/contracts/${taskArgs.newName}.sol`;

  if (!fs.existsSync(oldContractFile)) {
    throw `Contract file not found: "${oldContractFile}" (did you change the configuration manually?)`;
  }

  if (fs.existsSync(newContractFile)) {
    throw `A file with that name already exists: "${oldContractFile}"`;
  }

  // Replace names in source files
  replaceInFile(__dirname + '/../minting-dapp/src/scripts/lib/NftContractType.ts', CollectionConfig.contractName, taskArgs.newName);
  replaceInFile(__dirname + '/config/CollectionConfig.ts', CollectionConfig.contractName, taskArgs.newName);
  replaceInFile(__dirname + '/lib/NftContractProvider.ts', CollectionConfig.contractName, taskArgs.newName);
  replaceInFile(oldContractFile, CollectionConfig.contractName, taskArgs.newName);

  // Rename the contract file
  fs.renameSync(oldContractFile, newContractFile);

  console.log(`Contract renamed successfully from "${CollectionConfig.contractName}" to "${taskArgs.newName}"!`);

  // Rebuilding types
  await hre.run('typechain');
})
.addPositionalParam('newName', 'The new name');

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.9',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    truffle: {
      url: 'http://localhost:24012/rpc',
      timeout: 60000,
      gasMultiplier: DEFAULT_GAS_MULTIPLIER,
    },
    goerli: {
      url: "https://ethereum-goerli.publicnode.com",
      accounts: [process.env.NETWORK_TESTNET_PRIVATE_KEY],
      chainId: 5,
      live: true,
      saveDeployments: true,
      gasMultiplier: 2,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
    coinmarketcap: process.env.GAS_REPORTER_COIN_MARKET_CAP_API_KEY,
  },
  etherscan: {
    apiKey: {
      // Ethereum
      goerli: process.env.BLOCK_EXPLORER_API_KEY,
      mainnet: process.env.BLOCK_EXPLORER_API_KEY,
      rinkeby: process.env.BLOCK_EXPLORER_API_KEY,
      sepolia: process.env.BLOCK_EXPLORER_API_KEY,
      // Polygon
      polygon: process.env.BLOCK_EXPLORER_API_KEY,
      polygonMumbai: process.env.BLOCK_EXPLORER_API_KEY,
    },
  },
};

// Setup "testnet" network
if (process.env.NETWORK_TESTNET_URL !== undefined) {
  config.networks!.testnet = {
    url: process.env.NETWORK_TESTNET_URL,
    accounts: [process.env.NETWORK_TESTNET_PRIVATE_KEY!],
    gasMultiplier: DEFAULT_GAS_MULTIPLIER,
  };
}

// Setup "mainnet" network
if (process.env.NETWORK_MAINNET_URL !== undefined) {
  config.networks!.mainnet = {
    url: process.env.NETWORK_MAINNET_URL,
    accounts: [process.env.NETWORK_MAINNET_PRIVATE_KEY!],
    gasMultiplier: DEFAULT_GAS_MULTIPLIER,
  };
}

export default config;

/**
 * Replaces all occurrences of a string in the given file. 
 */
function replaceInFile(file: string, search: string, replace: string): void
{
  const fileContent = fs.readFileSync(file, 'utf8').replace(new RegExp(search, 'g'), replace);

  fs.writeFileSync(file, fileContent, 'utf8');
}
