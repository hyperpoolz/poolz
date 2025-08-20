// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@kevincharm/bls-bn254/contracts/BLS.sol";

/**
 * @title BLSVerifier
 * @notice Dedicated contract for BLS signature verification
 * @dev This contract houses the heavy BLS operations, allowing the main VRF contract
 *      to remain small enough for small-block deployment on HyperEVM
 */
contract BLSVerifier {
    /**
     * @notice Checks if a signature is valid (on curve)
     * @param sig The signature to validate
     * @return bool True if signature is valid
     */
    function isValidSignature(uint256[2] calldata sig) external pure returns (bool) {
        return BLS.isValidSignature(sig);
    }
    
    /**
     * @notice Verifies a single BLS signature against a public key and message
     * @param sig The signature to verify
     * @param pk The public key (G2 point)
     * @param message The message that was signed (G1 point)
     * @return ok True if signature verification passed
     * @return callSuccess True if the pairing check succeeded
     */
    function verifySingle(
        uint256[2] calldata sig,
        uint256[4] calldata pk,
        uint256[2] calldata message
    ) external view returns (bool ok, bool callSuccess) {
        return BLS.verifySingle(sig, pk, message);
    }
    
    /**
     * @notice Hashes arbitrary bytes to a point on the BN254 G1 curve
     * @param dst Domain separation tag
     * @param msgBytes The message bytes to hash
     * @return The resulting G1 point
     */
    function hashToPoint(bytes calldata dst, bytes calldata msgBytes)
        external view returns (uint256[2] memory)
    {
        return BLS.hashToPoint(dst, msgBytes);
    }
}