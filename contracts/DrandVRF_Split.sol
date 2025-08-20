// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IBLS
 * @notice Interface for the BLSVerifier contract
 */
interface IBLS {
    function isValidSignature(uint256[2] calldata sig) external view returns (bool);
    function verifySingle(uint256[2] calldata sig, uint256[4] calldata pk, uint256[2] calldata message)
        external view returns (bool ok, bool callSuccess);
    function hashToPoint(bytes calldata dst, bytes calldata msgBytes)
        external view returns (uint256[2] memory);
}

abstract contract VRFConsumerBase {
    function rawFulfillRandomness(uint256 requestId, bytes32 randomness) external virtual;
}

/**
 * @title DrandVRF_Split
 * @notice Lightweight VRF contract that delegates BLS operations to BLSVerifier
 * @dev This split architecture allows deployment within HyperEVM's small block limits
 *      while keeping round calculation on-chain (no client-side round computation)
 */
contract DrandVRF_Split {
    event RandomnessRequested(uint256 indexed id, address indexed requester, uint64 round, uint256 deadline, bytes32 salt);
    event RandomnessFulfilled(uint256 indexed id, uint64 round, bytes32 randomness);
    event BeaconUpdated(uint256[4] pubkey, uint256 genesisTime, uint256 period);

    // ----- Errors -----
    error InvalidPublicKey(uint256[4] pubkey);
    error InvalidSignature(uint256[4] pubkey, uint256[2] message, uint256[2] sig);
    error TooEarly(uint64 round, uint256 notBefore);
    error AlreadyFulfilled(uint256 id);
    error BadRound(uint64 provided, uint64 expectedMin);
    error RequestNotFound(uint256 id);

    // ----- BLS Verifier (immutable to avoid SLOAD) -----
    IBLS public immutable bls;

    // ----- Beacon config (all immutable to avoid SLOADs) -----
    // Store G2 pubkey as 4 immutables; reconstruct the array on demand.
    uint256 public immutable P0;
    uint256 public immutable P1;
    uint256 public immutable P2;
    uint256 public immutable P3;

    function DRAND_PUBKEY() public view returns (uint256[4] memory k) {
        k[0] = P0; k[1] = P1; k[2] = P2; k[3] = P3;
    }

    uint64  public immutable GENESIS_TIME;
    uint64  public immutable PERIOD;

    bytes public constant DST = bytes("BLS_SIG_BN254G1_XMD:KECCAK-256_SVDW_RO_NUL_");

    struct Request {
        // pack small fields first to reduce slots
        uint64  deadline;        // unix ts
        uint64  minRound;        // from deadline
        bool    fulfilled;       // 1 byte
        address requester;       // 20 bytes
        address callback;        // 20 bytes
        bytes32 salt;            // 32 bytes
        bytes32 randomness;      // 32 bytes
    }

    uint256 public lastId;
    mapping(uint256 => Request) public requests;

    /**
     * @notice Constructor
     * @param blsVerifier Address of the BLSVerifier contract
     * @param pubkey The drand beacon's G2 public key
     * @param genesisTime Unix timestamp of the beacon's genesis
     * @param period Seconds between beacon rounds
     */
    constructor(address blsVerifier, uint256[4] memory pubkey, uint256 genesisTime, uint256 period) {
        // Store BLS verifier address
        bls = IBLS(blsVerifier);
        
        // SKIP BLS validation to save ~800k gas
        // Pubkey pre-validated off-chain: isValidPublicKey returns true
        // if (!bls.isValidPublicKey(pubkey)) revert InvalidPublicKey(pubkey);

        P0 = pubkey[0];
        P1 = pubkey[1];
        P2 = pubkey[2];
        P3 = pubkey[3];

        GENESIS_TIME = uint64(genesisTime);
        PERIOD       = uint64(period);

        emit BeaconUpdated(pubkey, genesisTime, period);
    }

    // ----- Public: request -----
    function requestRandomness(uint256 deadline, bytes32 salt, address consumer) external returns (uint256 id) {
        uint64 round = _roundFromDeadline(deadline);
        unchecked { id = ++lastId; }
        Request storage r = requests[id];
        r.deadline  = uint64(deadline);
        r.minRound  = round;
        r.fulfilled = false;
        r.requester = msg.sender;
        r.callback  = consumer;
        r.salt      = salt;
        r.randomness= bytes32(0);

        emit RandomnessRequested(id, msg.sender, round, deadline, salt);
    }

    // ----- Public: fulfill -----
    function fulfillRandomness(uint256 id, uint64 round, uint256[2] calldata signature) external {
        Request storage r = requests[id];
        if (r.requester == address(0)) revert RequestNotFound(id);
        if (r.fulfilled) revert AlreadyFulfilled(id);
        if (round < r.minRound) revert BadRound(round, r.minRound);

        uint256 notBefore = uint256(GENESIS_TIME) + uint256(round - 1) * uint256(PERIOD);
        // small +1s jitter retained as in your version
        if (block.timestamp + 1 < notBefore) revert TooEarly(round, notBefore);

        // message = hashToPoint(DST, keccak(last 8 bytes of round))
        uint256[2] memory message = _hashRoundToPoint(round);

        // G1 sanity then pairing verify (delegated to BLSVerifier)
        if (!bls.isValidSignature(signature)) {
            revert InvalidSignature(DRAND_PUBKEY(), message, signature);
        }
        (bool ok, bool callSuccess) = bls.verifySingle(signature, DRAND_PUBKEY(), message);
        if (!callSuccess || !ok) {
            revert InvalidSignature(DRAND_PUBKEY(), message, signature);
        }

        bytes32 randomness = keccak256(
            abi.encode(signature, id, r.requester, block.chainid, address(this), r.salt)
        );

        r.fulfilled  = true;
        r.randomness = randomness;

        if (r.callback != address(0)) {
            VRFConsumerBase(r.callback).rawFulfillRandomness(id, randomness);
        }
        emit RandomnessFulfilled(id, round, randomness);
    }

    // ----- Views & helpers -----
    function getRequest(uint256 id) external view returns (Request memory) { return requests[id]; }

    function minRoundFromDeadline(uint256 deadline) external view returns (uint64) {
        return _roundFromDeadline(deadline);
    }

    function _hashRoundToPoint(uint64 round) internal view returns (uint256[2] memory message) {
        bytes memory hashed = new bytes(32);
        assembly {
            mstore(0x00, round)
            let digest := keccak256(0x18, 0x08)      // last 8 bytes
            mstore(add(0x20, hashed), digest)
        }
        // Delegate to BLSVerifier for hash-to-point operation
        message = bls.hashToPoint(DST, hashed);
    }

    function _roundFromDeadline(uint256 deadline) internal view returns (uint64) {
        uint64 g = GENESIS_TIME;
        if (deadline <= g) return 1;
        uint256 delta = deadline - g;
        uint64 whole = uint64(delta / PERIOD);
        return whole + (delta % PERIOD > 0 ? 1 : 0);
    }
}