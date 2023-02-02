// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

interface LANDS {
    function mint(address to) external;

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;

    function ownerOf(uint256 tokenId) external view returns (address);
}

contract LandSell is AccessControl, ERC721Holder {
    struct Map {
        address owner;
        uint256 tokenId;
        uint256 price;
        bool sellable;
    }
    using SafeERC20 for IERC20;

    IERC20 public nko;
    LANDS public land;
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    uint256 public constant totalSelableLands = 211900;
    mapping(uint256 => Map) public landMap;
    address public treasury;

    constructor(address _nko, address _land, address _treasury) {
        nko = IERC20(_nko);
        land = LANDS(_land);
        treasury = _treasury;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function mintLands(uint256 amount) external onlyRole(ADMIN_ROLE) {
        for (uint256 index; index < amount; index++) {
            land.mint(address(this));
        }
    }

    /// @dev defines the price for a range of tokenId
    /// @param start is the tokenId initial starting point
    /// @param end is the final tokenId
    /// @param price price to sell tokenId
    function definePricePerRange(
        uint256 start,
        uint256 end,
        uint256 price
    ) external onlyRole(ADMIN_ROLE) {
        for (uint256 index = start; index <= end; index++) {
            require(
                land.ownerOf(index) == address(this),
                "Sell Contract not owner of LAND"
            );
            landMap[index] = Map({
                owner: treasury,
                tokenId: index,
                price: price,
                sellable: true
            });
        }
    }

    function adminSetLandForSell(
        bool[] memory sell,
        uint256[] memory list
    ) external onlyRole(ADMIN_ROLE) {
        require(
            sell.length == list.length,
            "Length of parameter are different, should be equal"
        );

        for (uint256 index; index < list.length; index++) {
            landMap[list[index]].sellable = sell[index];
        }
    }

    function setLandForSell(bool sell, uint256 tokenId) external {
        require(
            landMap[tokenId].owner == msg.sender,
            "Caller not the LAND owner"
        );
        require(
            msg.sender == land.ownerOf(tokenId),
            "Sell Contract not owner of LAND"
        );
        landMap[tokenId].sellable = sell;
    }

    function adminDefineLandPrice(
        uint256 tokenId,
        uint256 price
    ) external onlyRole(ADMIN_ROLE) {
        require(
            msg.sender == land.ownerOf(tokenId),
            "Sell Contract not owner of LAND"
        );
        require(
            landMap[tokenId].owner == treasury,
            "LAND not owned by treasury"
        );
        landMap[tokenId].price = price;
    }

    function defineLandPrice(uint256 tokenId, uint256 price) external {
        require(
            msg.sender == land.ownerOf(tokenId),
            "Sell Contract not owner of LAND"
        );
        landMap[tokenId].price = price;
    }

    function buyLand(uint256[] memory tokenIds) external {
        for (uint256 index; index < tokenIds.length; index++) {
            Map memory map = landMap[tokenIds[index]];

            require(
                address(this) == land.ownerOf(map.tokenId),
                "Sell Contract does not own the LAND requested"
            );
            require(map.sellable == true, "LAND not for sell");
            nko.safeTransferFrom(msg.sender, map.owner, map.price);
            land.safeTransferFrom(address(this), msg.sender, map.tokenId);
            delete landMap[tokenIds[index]];
        }
    }

    function getPricePerRange(
        uint256 start,
        uint256 end
    ) public view returns (Map[] memory) {
        uint256 range = end - start + 1;
        Map[] memory map = new Map[](range);
        uint256 mapIndex;
        for (uint256 tokenId = start; tokenId <= end; tokenId++) {
            map[mapIndex] = landMap[tokenId];
            mapIndex++;
        }
        return map;
    }

    function getTokenIdPrice(
        uint256 tokenId
    ) public view returns (uint256 price) {
        price = landMap[tokenId].price;
    }

    function listLand(uint256 tokenId, uint256 price) external {
        require(
            landMap[tokenId].tokenId == 0,
            "Cannot override existing LAND listed"
        );

        require(
            land.ownerOf(tokenId) == msg.sender,
            "Caller does not own LAND"
        );
        require(price > 0, "LAND price must be greater than 0");
        land.safeTransferFrom(msg.sender, address(this), tokenId);
        Map memory map = Map({
            tokenId: tokenId,
            owner: msg.sender,
            price: price,
            sellable: true
        });
        landMap[tokenId] = map;
    }

    function retreiveLand(uint256 tokenId) external {
        Map memory map = landMap[tokenId];

        require(
            land.ownerOf(tokenId) == address(this),
            "Contract does not have the LAND"
        );
        require(map.owner == msg.sender, "Caller not the LAND owner");
        delete landMap[tokenId];
        land.safeTransferFrom(address(this), msg.sender, tokenId);
    }
}
