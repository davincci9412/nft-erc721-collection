import React from 'react';

interface Props {
  userAddress: string|null;
  totalSupply: number;
  maxSupply: number;
  isPaused: boolean;
  isWhitelist1MintEnabled: boolean;
  isWhitelist2MintEnabled: boolean;
  isUserInWhitelist1: boolean;
  isUserInWhitelist2: boolean;
  isSoldOut: boolean;
}

interface State {
}

const defaultState: State = {
};

export default class CollectionStatus extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = defaultState;
  }

  private isSaleOpenForWL1(): boolean
  {
    return (this.props.isWhitelist1MintEnabled || !this.props.isPaused) && !this.props.isSoldOut;
  }
  private isSaleOpenForWL2(): boolean
  {
    return (this.props.isWhitelist2MintEnabled || !this.props.isPaused) && !this.props.isSoldOut;
  }

  render() {
    return (
      <>
        <div className="collection-status">
          <div className="user-address">
            <span className="label">Wallet address:</span>
            <span className="address">{this.props.userAddress}</span>
          </div>
          
          <div className="supply">
            <span className="label">Supply</span>
            {this.props.totalSupply}/{this.props.maxSupply}
          </div>

          <div className="current-sale">
            <span className="label">Sale status</span>
            {this.isSaleOpenForWL1() ?
              <>
                {this.props.isWhitelist1MintEnabled ? 'Whitelist only' : 'Open'}
              </>
              :
              'Closed'
            }
            {this.isSaleOpenForWL2() ?
              <>
                {this.props.isWhitelist2MintEnabled ? 'Whitelist only' : 'Open'}
              </>
              :
              'Closed'
            }
          </div>
        </div>
      </>
    );
  }
}
