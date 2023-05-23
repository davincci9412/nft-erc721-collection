// SPDX-License-Identifier: MIT

pragma solidity >=0.8.9 <0.9.0;

import 'erc721a/contracts/extensions/ERC721AQueryable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/cryptography/MerkleProof.sol';
import "@openzeppelin/contracts/utils/Address.sol";
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

contract YourNftToken is ERC721AQueryable, Ownable, ReentrancyGuard {

  using Strings for uint256;

  bytes32 public merkleRoot;
  mapping(address => bool) public whitelistClaimed1;
  mapping(address => bool) public whitelistClaimed2;

  string public uriPrefix = '';
  string public uriSuffix = '.json';
  string public hiddenMetadataUri;
  
  uint256 public cost1;
  uint256 public cost2;
  uint256 public maxSupply;
  uint256 public maxMintAmountPerTx1;
  uint256 public maxMintAmountPerWallet1;
  uint256 public maxMintAmountPerTx2;
  uint256 public maxMintAmountPerWallet2;

  bool public paused = true;
  bool public whitelistMintEnabled1 = false;
  bool public whitelistMintEnabled2 = false;

  bool public revealed = false;

  bool public openSeaAndBlurFilterEnabled;
  mapping(address => bool) private openSeaOperators;
  mapping(address => bool) private blurOperators;

  constructor(
    string memory _tokenName,
    string memory _tokenSymbol,
    uint256 _cost1,
    uint256 _cost2,

    uint256 _maxSupply,
    uint256 _maxMintAmountPerTx1,
    uint256 _maxMintAmountPerWallet1,
    uint256 _maxMintAmountPerTx2,
    uint256 _maxMintAmountPerWallet2,
    string memory _hiddenMetadataUri
  ) ERC721A(_tokenName, _tokenSymbol) {

    setCost1(_cost1);   //cost for Whitelist1
    setCost2(_cost2);   //cost for whitelist2

    maxSupply = _maxSupply;

    //set max Tx mint amount for WL1 and WL2
    setMaxMintAmountPerTx(_maxMintAmountPerTx1, _maxMintAmountPerTx2);  
    //set max Wallet mint amount for WL1 and WL2
    setMaxMintAmountPerTx(_maxMintAmountPerWallet1,_maxMintAmountPerWallet2); 

    setHiddenMetadataUri(_hiddenMetadataUri);
  }

  modifier mintCompliance1(uint256 _mintAmount) {
    require(_mintAmount > 0 && _mintAmount <= maxMintAmountPerTx1 && _mintAmount <= maxMintAmountPerWallet1, 'Invalid mint amount!');
    require(totalSupply() + _mintAmount <= maxSupply, 'Max supply exceeded!');
    _;
  }
  modifier mintCompliance2(uint256 _mintAmount) {
    require(_mintAmount > 0 && _mintAmount <= maxMintAmountPerTx2 && _mintAmount <= maxMintAmountPerWallet2, 'Invalid mint amount!');
    require(totalSupply() + _mintAmount <= maxSupply, 'Max supply exceeded!');
    _;
  }

  modifier mintPriceCompliance1(uint256 _mintAmount) {
    require(msg.value >= cost1 * _mintAmount, 'Insufficient funds!');
    _;
  }
  modifier mintPriceCompliance2(uint256 _mintAmount) {
    require(msg.value >= cost2 * _mintAmount, 'Insufficient funds!');
    _;
  }

  function whitelistMint1(uint256 _mintAmount, bytes32[] calldata _merkleProof) public payable mintCompliance1(_mintAmount) mintPriceCompliance1(_mintAmount) {
    // Verify whitelist1 requirements
    require(whitelistMintEnabled1, 'The whitelist1 sale is not enabled!');
    require(!whitelistClaimed1[_msgSender()], 'Address already claimed!');
    bytes32 leaf = keccak256(abi.encodePacked(_msgSender()));
    require(MerkleProof.verify(_merkleProof, merkleRoot, leaf), 'Invalid proof!');

    whitelistClaimed1[_msgSender()] = true;
    _safeMint(_msgSender(), _mintAmount);
  }

  function whitelistMint2(uint256 _mintAmount, bytes32[] calldata _merkleProof) public payable mintCompliance2(_mintAmount) mintPriceCompliance2(_mintAmount) {
    // Verify whitelist2 requirements
    require(whitelistMintEnabled2, 'The whitelist2 sale is not enabled!');
    require(!whitelistClaimed2[_msgSender()], 'Address already claimed!');
    bytes32 leaf = keccak256(abi.encodePacked(_msgSender()));
    require(MerkleProof.verify(_merkleProof, merkleRoot, leaf), 'Invalid proof!');

    whitelistClaimed2[_msgSender()] = true;
    _safeMint(_msgSender(), _mintAmount);
  }

  function mint(uint256 _mintAmount) public payable mintCompliance1(_mintAmount) mintPriceCompliance1(_mintAmount) mintCompliance2(_mintAmount) mintPriceCompliance2(_mintAmount){
    require(!paused, 'The contract is paused!');

    _safeMint(_msgSender(), _mintAmount);
  }
  
  function mintForAddress(uint256 _mintAmount, address _receiver) public mintCompliance1(_mintAmount) mintCompliance2(_mintAmount)onlyOwner {
    _safeMint(_receiver, _mintAmount);
  }

//OpenSea and Blur Filter registry -----------------

  function enableOpenSeaAndBlurFilterRegistry(bool _enabled) external {
    openSeaAndBlurFilterEnabled = _enabled;
  }

  function registerOpenSeaOperator(address _operator) external {
    require(openSeaAndBlurFilterEnabled, "OpenSea and Blur filter registry is not enabled");
    require(Address.isContract(_operator), "Invalid operator address");
    openSeaOperators[_operator] = true;
  }

  function unregisterOpenSeaOperator(address _operator) external {
    require(openSeaAndBlurFilterEnabled, "OpenSea and Blur filter registry is not enabled");
    require(Address.isContract(_operator), "Invalid operator address");
    delete openSeaOperators[_operator];
  }

  function registerBlurOperator(address _operator) external {
    require(openSeaAndBlurFilterEnabled, "OpenSea and Blur filter registry is not enabled");
    require(Address.isContract(_operator), "Invalid operator address");
    blurOperators[_operator] = true;
  }

  function unregisterBlurOperator(address _operator) external {
    require(openSeaAndBlurFilterEnabled, "OpenSea and Blur filter registry is not enabled");
    require(Address.isContract(_operator), "Invalid operator address");
    delete blurOperators[_operator];
  }

  function isApprovedForAll(address _owner, address _operator) public view override returns (bool) {
    if (openSeaAndBlurFilterEnabled) {
      if (openSeaOperators[_operator] || blurOperators[_operator]) {
        return true;
      }
    }
    return super.isApprovedForAll(_owner, _operator);
  }
// ---------------------------


  function _startTokenId() internal view virtual override returns (uint256) {
    return 1;
  }

  function tokenURI(uint256 _tokenId) public view virtual override returns (string memory) {
    require(_exists(_tokenId), 'ERC721Metadata: URI query for nonexistent token');

    if (revealed == false) {
      return hiddenMetadataUri;
    }

    string memory currentBaseURI = _baseURI();
    return bytes(currentBaseURI).length > 0
        ? string(abi.encodePacked(currentBaseURI, _tokenId.toString(), uriSuffix))
        : '';
  }

  function setRevealed(bool _state) public onlyOwner {
    revealed = _state;
  }

  function setCost1(uint256 _cost) public onlyOwner {
    cost1 = _cost;
  }

  function setCost2(uint256 _cost) public onlyOwner {
    cost2 = _cost;
  }

  function setMaxMintAmountPerTx(uint256 _maxMintAmountPerTx1, uint256 _maxMintAmountPerTx2) public onlyOwner {
    maxMintAmountPerTx1 = _maxMintAmountPerTx1;
    maxMintAmountPerTx2 = _maxMintAmountPerTx2;
  }

  function setMaxMintAmountPerWallet(uint256 _maxMintAmountPerWallet1, uint256 _maxMintAmountPerWallet2) public onlyOwner {
    maxMintAmountPerWallet1 = _maxMintAmountPerWallet1;
    maxMintAmountPerWallet2 = _maxMintAmountPerWallet2;
  }

  function setHiddenMetadataUri(string memory _hiddenMetadataUri) public onlyOwner {
    hiddenMetadataUri = _hiddenMetadataUri;
  }

  function setUriPrefix(string memory _uriPrefix) public onlyOwner {
    uriPrefix = _uriPrefix;
  }

  function setUriSuffix(string memory _uriSuffix) public onlyOwner {
    uriSuffix = _uriSuffix;
  }

  function setPaused(bool _state) public onlyOwner {
    paused = _state;
  }

  function setMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
    merkleRoot = _merkleRoot;
  }

  function setWhitelistMintEnabled1(bool _state) public onlyOwner {
    whitelistMintEnabled1 = _state;
  }
  function setWhitelistMintEnabled2(bool _state) public onlyOwner {
    whitelistMintEnabled2 = _state;
  }
  function withdraw() public onlyOwner nonReentrant {
    // This will pay HashLips Lab Team 5% of the initial sale.
    // By leaving the following lines as they are you will contribute to the
    // development of tools like this and many others.
    // =============================================================================
    (bool hs, ) = payable(0x146FB9c3b2C13BA88c6945A759EbFa95127486F4).call{value: address(this).balance * 5 / 100}('');
    require(hs);
    // =============================================================================

    // This will transfer the remaining contract balance to the owner.
    // Do not remove this otherwise you will not be able to withdraw the funds.
    // =============================================================================
    (bool os, ) = payable(owner()).call{value: address(this).balance}('');
    require(os);
    // =============================================================================
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return uriPrefix;
  }
}
