// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./ERC4907.sol";

contract NeokiLands is ERC4907, AccessControl {
    using Strings for uint256;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant URI_UPDATER = keccak256("URI_UPDATER");
    string private baseURI;

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    uint public constant maxLands = 423801; // set this for prod

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseUri
    ) ERC4907(_name, _symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        baseURI = _baseUri;
    }

    modifier onlyMint() {
        uint256 currentAmountOfLands = _tokenIds.current();
        require(
            currentAmountOfLands <= maxLands,
            "NeokiLands: Max amount of LANDs achieved"
        );

        require(
            hasRole(MINTER_ROLE, msg.sender),
            "Caller does not have MINTER_ROLE"
        );
        _;
    }

    function mint(address to) external onlyMint {
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();
        _safeMint(to, tokenId);
        _setTokenURI(
            tokenId,
            string(abi.encodePacked("/", tokenId.toString(), ".json"))
        );
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(AccessControl, ERC4907) returns (bool) {
        return
            interfaceId == type(IERC4907).interfaceId ||
            interfaceId == type(AccessControl).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function _baseURI()
        internal
        view
        virtual
        override(ERC721)
        returns (string memory)
    {
        return baseURI;
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIds.current();
    }

    function updateURI(string memory uri) public returns (string memory) {
        require(
            hasRole(URI_UPDATER, msg.sender),
            "Caller does not have URI_UPDATER role"
        );
        baseURI = uri;
        return baseURI;
    }
}
