import { utils, BigNumber } from 'ethers';
import React from 'react';
import NetworkConfigInterface from '../../../../smart-contract/lib/NetworkConfigInterface';

interface Props {
  networkConfig: NetworkConfigInterface;
  maxSupply: number;
  totalSupply: number;
  tokenPriceForWL1: BigNumber;
  tokenPriceForWL2: BigNumber;
  maxMintAmountPerTx1: number;
  maxMintAmountPerTx2: number;
  isPaused: boolean;
  loading: boolean;
  isWhitelist1MintEnabled: boolean;
  isWhitelist2MintEnabled: boolean;
  isUserInWhitelist1: boolean;
  isUserInWhitelist2: boolean;
  mintTokens(mintAmount: number): Promise<void>;
  whitelistMintTokens1(mintAmount: number): Promise<void>;
  whitelistMintTokens2(mintAmount: number): Promise<void>;
}

interface State {
  mintAmount: number;
}

const defaultState: State = {
  mintAmount: 1,
};

export default class MintWidget extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = defaultState;
  }

  private canMintWL1(): boolean {
    return !this.props.isPaused || this.canWhitelist1Mint();
  }
  private canMintWL2(): boolean {
    return !this.props.isPaused || this.canWhitelist2Mint();
  }
  private canWhitelist1Mint(): boolean {
    return this.props.isWhitelist1MintEnabled && this.props.isUserInWhitelist1;
  }
  private canWhitelist2Mint(): boolean {
    return this.props.isWhitelist1MintEnabled && this.props.isUserInWhitelist2;
  }

  private incrementMintAmount1(): void {
    this.setState({
      mintAmount: Math.min(this.props.maxMintAmountPerTx1, this.state.mintAmount + 1),
    });
  }
  private incrementMintAmount2(): void {
    this.setState({
      mintAmount: Math.min(this.props.maxMintAmountPerTx2, this.state.mintAmount + 1),
    });
  }

  private decrementMintAmount(): void {
    this.setState({
      mintAmount: Math.max(1, this.state.mintAmount - 1),
    });
  }

  private async mintWL1(): Promise<void> {
    if (!this.props.isPaused) {
      await this.props.mintTokens(this.state.mintAmount);

      return;
    }

    await this.props.whitelistMintTokens1(this.state.mintAmount);
  }
  private async mintWL2(): Promise<void> {
    if (!this.props.isPaused) {
      await this.props.mintTokens(this.state.mintAmount);

      return;
    }

    await this.props.whitelistMintTokens2(this.state.mintAmount);
  }
  render() {
    return (
      <>
        {this.canMintWL1() ?
          <div className={`mint-widget ${this.props.loading ? 'animate-pulse saturate-0 pointer-events-none' : ''}`}>
            <div className="preview">
              <img src="/build/images/preview.png" alt="Collection preview" />
            </div>

            <div className="price">
              <strong>Total price:</strong> {utils.formatEther(this.props.tokenPriceForWL1.mul(this.state.mintAmount))} {this.props.networkConfig.symbol}
            </div>

            <div className="controls">
              <button className="decrease" disabled={this.props.loading} onClick={() => this.decrementMintAmount()}>-</button>
              <span className="mint-amount">{this.state.mintAmount}</span>
              <button className="increase" disabled={this.props.loading} onClick={() => this.incrementMintAmount1()}>+</button>
              <button className="primary" disabled={this.props.loading} onClick={() => this.mintWL1()}>Mint</button>
            </div>
          </div>
          :
          <div className="cannot-mint">
            <span className="emoji">⏳</span>

            {this.props.isWhitelist1MintEnabled ? <>You are not included in the <strong>whitelist1</strong>.</> : <>The contract is <strong>paused</strong> for Whitelist1.</>}<br />
            Please come back during the next sale!
          </div>
        }

        {this.canMintWL2() ?
          <div className={`mint-widget ${this.props.loading ? 'animate-pulse saturate-0 pointer-events-none' : ''}`}>
            <div className="preview">
              <img src="/build/images/preview.png" alt="Collection preview" />
            </div>

            <div className="price">
              <strong>Total price:</strong> {utils.formatEther(this.props.tokenPriceForWL2.mul(this.state.mintAmount))} {this.props.networkConfig.symbol}
            </div>

            <div className="controls">
              <button className="decrease" disabled={this.props.loading} onClick={() => this.decrementMintAmount()}>-</button>
              <span className="mint-amount">{this.state.mintAmount}</span>
              <button className="increase" disabled={this.props.loading} onClick={() => this.incrementMintAmount2()}>+</button>
              <button className="primary" disabled={this.props.loading} onClick={() => this.mintWL2()}>Mint</button>
            </div>
          </div>
          :
          <div className="cannot-mint">
            <span className="emoji">⏳</span>

            {this.props.isWhitelist2MintEnabled ? <>You are not included in the <strong>whitelist2</strong>.</> : <>The contract is <strong>paused</strong> for Whitelist1.</>}<br />
            Please come back during the next sale!
          </div>
        }
      </>
    );
  }
}
