// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./ERC4907.sol";

contract NeokiLands is ERC4907, AccessControl {
    using Strings for uint256;
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant URI_UPDATER = keccak256("URI_UPDATER");
    string private baseURI;

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    uint256 public constant maxLands = 423801; // set this for prod

    constructor(string memory _baseUri) ERC4907("Neoki LANDS", "LANDS") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(URI_UPDATER, msg.sender);

        _setRoleAdmin(MINTER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(URI_UPDATER, ADMIN_ROLE);
        baseURI = _baseUri;
    }

    modifier onlyMint() {
        uint256 currentAmountOfLands = _tokenIds.current();
        require(
            currentAmountOfLands < maxLands,
            "NeokiLands: Max amount of LANDs achieved"
        );
        _;
    }

    function mint(address to) external onlyMint onlyRole(MINTER_ROLE) {
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();
        _safeMint(to, tokenId);
        _setTokenURI(
            tokenId,
            string(abi.encodePacked("/", tokenId.toString(), ".json"))
        );
    }

    function mintBatch(
        uint256 amount,
        address to
    ) external onlyRole(MINTER_ROLE) {
        require(amount <= 300, "Cannot mint more than 300 at once");
        for (uint i = 0; i < amount; i++) {
            _tokenIds.increment();
            require(
                _tokenIds.current() <= maxLands,
                "NeokiLands: Max amount of LANDs achieved"
            );
            uint256 tokenId = _tokenIds.current();
            _safeMint(to, tokenId);
            _setTokenURI(
                tokenId,
                string(abi.encodePacked("/", tokenId.toString(), ".json"))
            );
        }
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

    function updateURI(
        string memory uri
    ) external onlyRole(URI_UPDATER) returns (string memory) {
        baseURI = uri;
        return baseURI;
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
}
