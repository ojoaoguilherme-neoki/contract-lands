// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Lands.sol";

contract LandSell is AccessControl, ERC721Holder, ReentrancyGuard {
  bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
  uint16 public fee = 400;
  address public foundation;
  struct Map {
    address owner;
    uint256 tokenId;
    uint256 price;
  }
  using SafeERC20 for IERC20;
  using Counters for Counters.Counter;

  IERC20 public token; //Niko Token address
  IERC721 public land; // Neoki LANDs

  // Getters
  uint256[] public tokensForSell;
  mapping(uint256 => Map) public landMap;

  constructor(address _token, address _land, address _foundation) {
    require(
      _token != address(0),
      "LandSell: NKO cannot be set to address(0)"
    );
    require(
      _land != address(0),
      "LandSell: LANDS cannot be set to address(0)"
    );

    require(
      _foundation != address(0),
      "LandSell: LANDS cannot be set to address(0)"
    );

    token = IERC20(_token);
    land = IERC721(_land);
    foundation = _foundation;
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(ADMIN_ROLE, msg.sender);
  }

  modifier onlyWhenContractOwnLand(uint256 tokenId) {
    require(
      land.ownerOf(tokenId) == address(this),
      "LandSell: Contract does not own LAND"
    );
    require(
      landMap[tokenId].owner == msg.sender,
      "LandSell: Caller not LAND owner"
    );
    _;
  }

  modifier onlyWhenLandOwner(Map memory landToken) {
    require(
      landToken.owner != address(0),
      "LandSell: Owner cannot be address 0"
    );
    require(
      landToken.price > 0,
      "LandSell: Price cannot be less than or equal to 0"
    );
    require(
      landToken.tokenId > 0,
      "LandSell: LAND tokenId cannot be less than or equal to 0"
    );
    require(
      landMap[landToken.tokenId].tokenId == 0,
      "LandSell: Land token ID must not be already registered"
    );
    _;
  }

  function getLand(
    uint256 tokenId
  ) external view returns (Map memory) {
    return landMap[tokenId];
  }

  function getAllSellingLands() external view returns (Map[] memory) {
    Map[] memory landsForSell = new Map[](tokensForSell.length);
    uint256 index = 0;
    for (uint i = 0; i < tokensForSell.length; i++) {
      landsForSell[index] = landMap[tokensForSell[i]];
      index++;
    }
    return landsForSell;
  }

  /// User is selling multiple lands at once
  /// @param tokens tokenIDs
  function sellBatchLands(
    Map[] calldata tokens
  ) external nonReentrant {
    require(
      tokens.length > 0 && tokens.length <= 300,
      "LandSell: Tokens batch cannot be zero nor above 300"
    );
    for (uint256 i = 0; i < tokens.length; i++) {
      require(
        tokens[i].owner != address(0),
        "LandSell: Owner cannot be address 0"
      );
      require(
        tokens[i].price > 0,
        "LandSell: Price cannot be less than or equal to 0"
      );
      require(
        land.ownerOf(tokens[i].tokenId) == msg.sender,
        "LandSell: Caller does not own LAND"
      );
      require(
        landMap[tokens[i].tokenId].tokenId == 0,
        "LandSell: Land cannot be already for sell"
      );
      land.safeTransferFrom(
        msg.sender,
        address(this),
        tokens[i].tokenId
      );
      landMap[tokens[i].tokenId] = tokens[i];
      tokensForSell.push(tokens[i].tokenId);
    }
  }

  /// User is selling one land
  /// @param landToken TokenID
  function sellLand(
    Map memory landToken
  ) external onlyWhenLandOwner(landToken) nonReentrant {
    land.safeTransferFrom(
      msg.sender,
      address(this),
      landToken.tokenId
    );
    landMap[landToken.tokenId] = landToken;
    tokensForSell.push(landToken.tokenId);
  }

  function updateLandPrice(
    uint256 tokenId,
    uint256 price
  ) external onlyWhenContractOwnLand(tokenId) nonReentrant {
    require(price > 0, "LandSell: Cannot set price of 0");
    landMap[tokenId].price = price;
  }

  function updateFee(
    uint16 updatedFee
  ) external onlyRole(ADMIN_ROLE) {
    fee = updatedFee;
  }

  function removeLandFromLandsArray(uint256 tokenId) internal {
    uint256 removeIndex = 0;
    for (uint256 i = 0; i < tokensForSell.length; i++) {
      if (tokensForSell[i] == tokenId) {
        delete tokensForSell[i];
        removeIndex = i;
      }
    }
    tokensForSell[removeIndex] = tokensForSell[
      tokensForSell.length - 1
    ];
    tokensForSell.pop();
  }

  // User is buying 1 land
  function buyLand(uint256 tokenId) external nonReentrant {
    require(
      tokenId != 0,
      "LandSell: there is no token with tokenId 0"
    );
    require(
      land.ownerOf(tokenId) == address(this),
      "LandSell: Contract does not own LAND"
    );
    Map memory currentLand = landMap[tokenId];
    removeLandFromLandsArray(tokenId);
    delete landMap[tokenId];
    uint256 foundationFee = (currentLand.price * fee) / 10000;
    uint256 paying = currentLand.price - foundationFee;

    token.safeTransferFrom(
      msg.sender,
      address(this),
      currentLand.price
    );

    token.transfer(foundation, foundationFee);
    token.transfer(currentLand.owner, paying);

    land.safeTransferFrom(address(this), msg.sender, tokenId);
  }

  function removeLand(
    uint256 tokenId
  ) external onlyWhenContractOwnLand(tokenId) nonReentrant {
    Map memory currentLand = landMap[tokenId];
    removeLandFromLandsArray(tokenId);
    delete landMap[tokenId];
    land.safeTransferFrom(
      address(this),
      currentLand.owner,
      currentLand.tokenId
    );
  }
}
