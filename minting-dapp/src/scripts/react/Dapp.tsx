import React from 'react';
import { ethers, BigNumber } from 'ethers'
import { ExternalProvider, Web3Provider } from '@ethersproject/providers';
import detectEthereumProvider from '@metamask/detect-provider';
import NftContractType from '../lib/NftContractType';
import CollectionConfig from '../../../../smart-contract/config/CollectionConfig';
import NetworkConfigInterface from '../../../../smart-contract/lib/NetworkConfigInterface';
import CollectionStatus from './CollectionStatus';
import MintWidget from './MintWidget';
import Whitelist1 from '../lib/Whitelist1';
import Whitelist2 from '../lib/Whitelist2';
import { toast } from 'react-toastify';

const ContractAbi = require('../../../../smart-contract/artifacts/contracts/' + CollectionConfig.contractName + '.sol/' + CollectionConfig.contractName + '.json').abi;

interface Props {
}

interface State {
  userAddress: string|null;
  network: ethers.providers.Network|null;
  networkConfig: NetworkConfigInterface;
  totalSupply: number;
  maxSupply: number;
  maxMintAmountPerTx1: number;
  maxMintAmountPerTx2: number;
  tokenPriceForWL1: BigNumber;
  tokenPriceForWL2: BigNumber;
  isPaused: boolean;
  loading: boolean;
  isWhitelist1MintEnabled: boolean;
  isWhitelist2MintEnabled: boolean;
  isUserInWhitelist1: boolean;
  isUserInWhitelist2: boolean;
  merkleProofManualAddress1: string;
  merkleProofManualAddress2: string;
  merkleProofManualAddressFeedbackMessage1: string|JSX.Element|null;
  merkleProofManualAddressFeedbackMessage2: string|JSX.Element|null;
  errorMessage: string|JSX.Element|null;
}

const defaultState: State = {
  userAddress: null,
  network: null,
  networkConfig: CollectionConfig.mainnet,
  totalSupply: 0,
  maxSupply: 0,
  maxMintAmountPerTx1: 0,
  maxMintAmountPerTx2: 0,
  tokenPriceForWL1: BigNumber.from(0),
  tokenPriceForWL2: BigNumber.from(0),
  isPaused: true,
  loading: false,
  isWhitelist1MintEnabled: false,
  isWhitelist2MintEnabled: false,
  isUserInWhitelist1: false,
  isUserInWhitelist2: false,
  merkleProofManualAddress1: '',
  merkleProofManualAddress2: '',
  merkleProofManualAddressFeedbackMessage1: null,
  merkleProofManualAddressFeedbackMessage2: null,
  errorMessage: null,
};

export default class Dapp extends React.Component<Props, State> {
  provider!: Web3Provider;

  contract!: NftContractType;

  private merkleProofManualAddressInput1!: HTMLInputElement;
  private merkleProofManualAddressInput2!: HTMLInputElement;
  constructor(props: Props) {
    super(props);

    this.state = defaultState;
  }

  componentDidMount = async () => {
    const browserProvider = await detectEthereumProvider() as ExternalProvider;

    if (browserProvider?.isMetaMask !== true) {
      this.setError(
        <>
          We were not able to detect <strong>MetaMask</strong>. We value <strong>privacy and security</strong> a lot so we limit the wallet options on the DAPP.<br />
          <br />
          But don't worry! <span className="emoji">😃</span> You can always interact with the smart-contract through <a href={this.generateContractUrl()} target="_blank">{this.state.networkConfig.blockExplorer.name}</a> and <strong>we do our best to provide you with the best user experience possible</strong>, even from there.<br />
          <br />
          You can also get your <strong>Whitelist Proof</strong> manually, using the tool below.
        </>,
      );

      
    }

    this.provider = new ethers.providers.Web3Provider(browserProvider);

    this.registerWalletEvents(browserProvider);

    await this.initWallet();
  }
///mintTokens price with WL1 only
  async mintTokens(amount: number): Promise<void>
  {
    try {
      this.setState({loading: true});
      const transaction = await this.contract.mint(amount, {value: this.state.tokenPriceForWL1.mul(amount)});

      toast.info(<>
        Transaction sent! Please wait...<br/>
        <a href={this.generateTransactionUrl(transaction.hash)} target="_blank" rel="noopener">View on {this.state.networkConfig.blockExplorer.name}</a>
      </>);

      const receipt = await transaction.wait();

      toast.success(<>
        Success!<br />
        <a href={this.generateTransactionUrl(receipt.transactionHash)} target="_blank" rel="noopener">View on {this.state.networkConfig.blockExplorer.name}</a>
      </>);

      this.refreshContractState();
      this.setState({loading: false});
    } catch (e) {
      this.setError(e);
      this.setState({loading: false});
    }
  }

  async whitelist1MintTokens(amount: number): Promise<void>
  {
    try {
      this.setState({loading: true});
      const transaction = await this.contract.whitelistMint1(amount, Whitelist1.getProofForAddress(this.state.userAddress!), {value: this.state.tokenPriceForWL1.mul(amount)});

      toast.info(<>
        Transaction sent! Please wait...<br/>
        <a href={this.generateTransactionUrl(transaction.hash)} target="_blank" rel="noopener">View on {this.state.networkConfig.blockExplorer.name}</a>
      </>);

      const receipt = await transaction.wait();

      toast.success(<>
        Success!<br />
        <a href={this.generateTransactionUrl(receipt.transactionHash)} target="_blank" rel="noopener">View on {this.state.networkConfig.blockExplorer.name}</a>
      </>);

      this.refreshContractState();
      this.setState({loading: false});
    } catch (e) {
      this.setError(e);
      this.setState({loading: false});
    }
  }
  async whitelist2MintTokens(amount: number): Promise<void>
  {
    try {
      this.setState({loading: true});
      const transaction = await this.contract.whitelistMint2(amount, Whitelist2.getProofForAddress(this.state.userAddress!), {value: this.state.tokenPriceForWL2.mul(amount)});

      toast.info(<>
        Transaction sent! Please wait...<br/>
        <a href={this.generateTransactionUrl(transaction.hash)} target="_blank" rel="noopener">View on {this.state.networkConfig.blockExplorer.name}</a>
      </>);

      const receipt = await transaction.wait();

      toast.success(<>
        Success!<br />
        <a href={this.generateTransactionUrl(receipt.transactionHash)} target="_blank" rel="noopener">View on {this.state.networkConfig.blockExplorer.name}</a>
      </>);

      this.refreshContractState();
      this.setState({loading: false});
    } catch (e) {
      this.setError(e);
      this.setState({loading: false});
    }
  }
  private isWalletConnected(): boolean
  {
    return this.state.userAddress !== null;
  }

  private isContractReady(): boolean
  {
    return this.contract !== undefined;
  }

  private isSoldOut(): boolean
  {
    return this.state.maxSupply !== 0 && this.state.totalSupply >= this.state.maxSupply;
  }

  private isNotMainnet(): boolean
  {
    return this.state.network !== null && this.state.network.chainId !== CollectionConfig.mainnet.chainId;
  }

  private isNotTestnet(): boolean
  {
    return this.state.network !== null && this.state.network.chainId !== CollectionConfig.testnet.chainId;
  }

  private copyMerkleProofToClipboard1(): void
  {
    const merkleProof = Whitelist1.getRawProofForAddress(this.state.userAddress ?? this.state.merkleProofManualAddress1);

    if (merkleProof.length < 1) {
      this.setState({
        merkleProofManualAddressFeedbackMessage1: 'The given address is not in the whitelist1, please double-check.',
      });

      return;
    }

    navigator.clipboard.writeText(merkleProof);

    this.setState({
      merkleProofManualAddressFeedbackMessage1:
      <>
        <strong>Congratulations!</strong> <span className="emoji">🎉</span><br />
        Your Merkle Proof <strong>has been copied to the clipboard</strong>. You can paste it into <a href={this.generateContractUrl()} target="_blank">{this.state.networkConfig.blockExplorer.name}</a> to claim your tokens.
      </>,
    });

    console.log("Merkle1: " + merkleProof)
  }

  private copyMerkleProofToClipboard2(): void
  {
    const merkleProof = Whitelist2.getRawProofForAddress(this.state.userAddress ?? this.state.merkleProofManualAddress2);

    if (merkleProof.length < 1) {
      this.setState({
        merkleProofManualAddressFeedbackMessage2: 'The given address is not in the whitelist2, please double-check.',
      });

      return;
    }

    navigator.clipboard.writeText(merkleProof);

    this.setState({
      merkleProofManualAddressFeedbackMessage2:
      <>
        <strong>Congratulations!</strong> <span className="emoji">🎉</span><br />
        Your Merkle Proof <strong>has been copied to the clipboard</strong>. You can paste it into <a href={this.generateContractUrl()} target="_blank">{this.state.networkConfig.blockExplorer.name}</a> to claim your tokens.
      </>,
    });

    console.log("Merkle2: " + merkleProof)
  }
  render() {
    return (
      <>
      
        {/* {this.isNotMainnet() ?
          <div className="not-mainnet">
            You are not connected to the main network.
            <span className="small">Current network: <strong>{this.state.network?.name}</strong></span>
          </div>
          : null} */

          this.isNotTestnet() ?
            <div className="not-mainnet">
              You are not connected to the Goerli Test network.
              <span className="small">Current network: <strong>{this.state.network?.name}</strong></span>
            </div>
            : null
          }

        {this.state.errorMessage ? <div className="error"><p>{this.state.errorMessage}</p><button onClick={() => this.setError()}>Close</button></div> : null}

        {this.isWalletConnected() ?
          <>
            {this.isContractReady() ?
              <>
                <CollectionStatus
                  userAddress={this.state.userAddress}
                  maxSupply={this.state.maxSupply}
                  totalSupply={this.state.totalSupply}
                  isPaused={this.state.isPaused}
                  isWhitelist1MintEnabled={this.state.isWhitelist1MintEnabled}
                  isWhitelist2MintEnabled={this.state.isWhitelist2MintEnabled}
                  isUserInWhitelist1={this.state.isUserInWhitelist1}
                  isUserInWhitelist2={this.state.isUserInWhitelist2}
                  isSoldOut={this.isSoldOut()}
                />
                {!this.isSoldOut() ?
                  <MintWidget
                    networkConfig={this.state.networkConfig}
                    maxSupply={this.state.maxSupply}
                    totalSupply={this.state.totalSupply}
                    tokenPriceForWL1={this.state.tokenPriceForWL1}
                    tokenPriceForWL2={this.state.tokenPriceForWL2}
                    maxMintAmountPerTx1={this.state.maxMintAmountPerTx1}
                    maxMintAmountPerTx2={this.state.maxMintAmountPerTx2}
                    isPaused={this.state.isPaused}
                    isWhitelist1MintEnabled={this.state.isWhitelist1MintEnabled}
                    isWhitelist2MintEnabled={this.state.isWhitelist2MintEnabled}
                    isUserInWhitelist1={this.state.isUserInWhitelist1}
                    isUserInWhitelist2={this.state.isUserInWhitelist2}
                    mintTokens={(mintAmount) => this.mintTokens(mintAmount)}
                    whitelistMintTokens1={(mintAmount) => this.whitelist1MintTokens(mintAmount)}
                    whitelistMintTokens2={(mintAmount) => this.whitelist2MintTokens(mintAmount)}
                    loading={this.state.loading}
                  />
                  :
                  <div className="collection-sold-out">
                    <h2>Tokens have been <strong>sold out</strong>! <span className="emoji">🥳</span></h2>

                    You can buy from our beloved holders on <a href={this.generateMarketplaceUrl()} target="_blank">{CollectionConfig.marketplaceConfig.name}</a>.
                  </div>
                }
              </>
              :
              <div className="collection-not-ready">
                <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>

                Loading collection data...
              </div>
            }
          </>
        :
          <div className="no-wallet">
            {!this.isWalletConnected() ? <button className="primary" disabled={this.provider === undefined} onClick={() => this.connectWallet()}>Connect Wallet</button> : null}

            <div className="use-block-explorer">
              Hey, looking for a <strong>super-safe experience</strong>? <span className="emoji">😃</span><br />
              You can interact with the smart-contract <strong>directly</strong> through <a href={this.generateContractUrl()} target="_blank">{this.state.networkConfig.blockExplorer.name}</a>, without even connecting your wallet to this DAPP! <span className="emoji">🚀</span><br />
              <br />
              Keep safe! <span className="emoji">❤️</span>
            </div>

            {!this.isWalletConnected()?<div>
              {!this.state.isWhitelist1MintEnabled ?
              <div className="merkle-proof-manual-address">
                <h2>Whitelist1 Proof</h2>
                <p>
                  Anyone can generate the proof using any public address in the whitelist1, but <strong>only the owner of that address</strong> will be able to make a successful transaction by using it.
                </p>

                {this.state.merkleProofManualAddressFeedbackMessage1 ? <div className="feedback-message">{this.state.merkleProofManualAddressFeedbackMessage1}</div> : null}

                <label htmlFor="merkle-proof-manual-address">Public address:</label>
                <input id="merkle-proof-manual-address" type="text" placeholder="0x000..." 
                  disabled={this.state.userAddress !== null} 
                  value={this.state.userAddress ?? this.state.merkleProofManualAddress1} 
                  ref={(input) => this.merkleProofManualAddressInput1 = input!} 
                  onChange={() => {this.setState({merkleProofManualAddress1: this.merkleProofManualAddressInput1.value})}} /> 
                <button onClick={() => this.copyMerkleProofToClipboard1()}>Generate and copy to clipboard</button>

                </div>
              : null}

              {!this.state.isWhitelist2MintEnabled ?
                <div className="merkle-proof-manual-address">
                <h2>Whitelist2 Proof</h2>
                <p>
                  Anyone can generate the proof using any public address in the whitelist2, but <strong>only the owner of that address</strong> will be able to make a successful transaction by using it.
                </p>

                {this.state.merkleProofManualAddressFeedbackMessage2 ? <div className="feedback-message">{this.state.merkleProofManualAddressFeedbackMessage2}</div> : null}

                <label htmlFor="merkle-proof-manual-address">Public address:</label>
                <input id="merkle-proof-manual-address" type="text" placeholder="0x000..." 
                  disabled={this.state.userAddress !== null} 
                  value={this.state.userAddress ?? this.state.merkleProofManualAddress2} 
                  ref={(input) => this.merkleProofManualAddressInput2 = input!} 
                  onChange={() => {this.setState({merkleProofManualAddress2: this.merkleProofManualAddressInput2.value})}} />
               <button onClick={() => this.copyMerkleProofToClipboard2()}>Generate and copy to clipboard</button>
              
                </div>
              : null}
            </div>:null}
            
          </div>
        }
      </>
    );
  }

  private setError(error: any = null): void
  {
    let errorMessage = 'Unknown error...';

    if (null === error || typeof error === 'string') {
      errorMessage = error;
    } else if (typeof error === 'object') {
      // Support any type of error from the Web3 Provider...
      if (error?.error?.message !== undefined) {
        errorMessage = error.error.message;
      } else if (error?.data?.message !== undefined) {
        errorMessage = error.data.message;
      } else if (error?.message !== undefined) {
        errorMessage = error.message;
      } else if (React.isValidElement(error)) {
        this.setState({errorMessage: error});

        return;
      }
    }

    this.setState({
      errorMessage: null === errorMessage ? null : errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1),
    });
  }

  private generateContractUrl(): string
  {
    return this.state.networkConfig.blockExplorer.generateContractUrl(CollectionConfig.contractAddress!);
  }

  private generateMarketplaceUrl(): string
  {
    return CollectionConfig.marketplaceConfig.generateCollectionUrl(CollectionConfig.marketplaceIdentifier, !this.isNotMainnet());
  }

  private generateTransactionUrl(transactionHash: string): string
  {
    return this.state.networkConfig.blockExplorer.generateTransactionUrl(transactionHash);
  }

  private async connectWallet(): Promise<void>
  {
    try {
      await this.provider.provider.request!({ method: 'eth_requestAccounts' });

      this.initWallet();
    } catch (e) {
      this.setError(e);
    }
  }

  private async refreshContractState(): Promise<void>
  {
    this.setState({
      maxSupply: (await this.contract.maxSupply()).toNumber(),
      totalSupply: (await this.contract.totalSupply()).toNumber(),
      maxMintAmountPerTx1: (await this.contract.maxMintAmountPerTx1()).toNumber(),
      maxMintAmountPerTx2: (await this.contract.maxMintAmountPerTx2()).toNumber(),
      tokenPriceForWL1: await this.contract.cost1(),
      tokenPriceForWL2: await this.contract.cost2(),
      isPaused: await this.contract.paused(),
      isWhitelist1MintEnabled: await this.contract.whitelistMintEnabled1(),
      isWhitelist2MintEnabled: await this.contract.whitelistMintEnabled2(),
      isUserInWhitelist1: Whitelist1.contains(this.state.userAddress ?? ''),
      isUserInWhitelist2: Whitelist2.contains(this.state.userAddress ?? ''),
    });
  }

  private async initWallet(): Promise<void>
  {
    const walletAccounts = await this.provider.listAccounts();

    this.setState(defaultState);

    if (walletAccounts.length === 0) {
      return;
    }

    const network = await this.provider.getNetwork();
    let networkConfig: NetworkConfigInterface;

    if (network.chainId === CollectionConfig.mainnet.chainId) {
      networkConfig = CollectionConfig.mainnet;
    } else if (network.chainId === CollectionConfig.testnet.chainId) {
      networkConfig = CollectionConfig.testnet;
    } else {
      this.setError('Unsupported network!');

      return;
    }

    this.setState({
      userAddress: walletAccounts[0],
      network,
      networkConfig,
    });

    if (await this.provider.getCode(CollectionConfig.contractAddress!) === '0x') {
      this.setError('Could not find the contract, are you connected to the right chain?');

      return;
    }

    this.contract = new ethers.Contract(
      CollectionConfig.contractAddress!,
      ContractAbi,
      this.provider.getSigner(),
    ) as NftContractType;

    this.refreshContractState();
  }

  private registerWalletEvents(browserProvider: ExternalProvider): void
  {
    // @ts-ignore
    browserProvider.on('accountsChanged', () => {
      this.initWallet();
    });

    // @ts-ignore
    browserProvider.on('chainChanged', () => {
      window.location.reload();
    });
  }
}
