// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CertificateRegistry {
    struct Certificate {
        string studentName;
        string courseName;
        string ipfsHash;
        bytes32 certificateHash;  // Hash of certificate data
        uint64 issuedDate;
        address issuer;
        bool isRevoked;  // Revocation status
    }

    address public admin;
    mapping(address => bool) public authorizedIssuers;
    mapping(uint256 => Certificate) public certificates;
    mapping(bytes32 => bool) public certificateHashExists;  // Track unique hashes
    uint256 public certificateCount;

    event CertificateIssued(
        uint256 indexed certificateId,
        string studentName,
        string courseName,
        string ipfsHash,
        bytes32 certificateHash,
        address indexed issuer
    );

    event CertificateRevoked(
        uint256 indexed certificateId,
        address indexed revokedBy
    );

    event IssuerAuthorized(address indexed issuer);
    event IssuerRevoked(address indexed issuer);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == admin || authorizedIssuers[msg.sender],
            "Not authorized to issue certificates"
        );
        _;
    }

    constructor() {
        admin = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }

    function issueCertificate(
        string calldata _studentName,
        string calldata _courseName,
        string calldata _ipfsHash,
        bytes32 _certificateHash
    ) external onlyAuthorized returns (uint256) {
        require(!certificateHashExists[_certificateHash], "Certificate hash already exists");
        
        unchecked {
            certificateCount++;
        }
        
        certificates[certificateCount] = Certificate(
            _studentName,
            _courseName,
            _ipfsHash,
            _certificateHash,
            uint64(block.timestamp),
            msg.sender,
            false  // Not revoked
        );

        certificateHashExists[_certificateHash] = true;

        emit CertificateIssued(
            certificateCount,
            _studentName,
            _courseName,
            _ipfsHash,
            _certificateHash,
            msg.sender
        );

        return certificateCount;
    }

    function revokeCertificate(uint256 _id) external onlyAuthorized {
        require(_id > 0 && _id <= certificateCount, "Invalid certificate ID");
        require(!certificates[_id].isRevoked, "Certificate already revoked");
        
        certificates[_id].isRevoked = true;
        emit CertificateRevoked(_id, msg.sender);
    }

    function authorizeIssuer(address _issuer) external onlyAdmin {
        require(!authorizedIssuers[_issuer], "Already authorized");
        authorizedIssuers[_issuer] = true;
        emit IssuerAuthorized(_issuer);
    }

    function revokeIssuer(address _issuer) external onlyAdmin {
        require(authorizedIssuers[_issuer], "Not authorized");
        require(_issuer != admin, "Cannot revoke admin");
        authorizedIssuers[_issuer] = false;
        emit IssuerRevoked(_issuer);
    }

    function verifyCertificate(uint256 _id)
        external
        view
        returns (Certificate memory)
    {
        require(_id > 0 && _id <= certificateCount, "Invalid certificate ID");
        return certificates[_id];
    }

    function verifyCertificateByHash(bytes32 _hash)
        external
        view
        returns (bool exists, bool isValid)
    {
        exists = certificateHashExists[_hash];
        
        if (exists) {
            // Find the certificate with this hash
            for (uint256 i = 1; i <= certificateCount; i++) {
                if (certificates[i].certificateHash == _hash) {
                    isValid = !certificates[i].isRevoked;
                    return (exists, isValid);
                }
            }
        }
        
        return (false, false);
    }

    function getCertificateDetails(uint256 _id)
        external
        view
        returns (
            string memory studentName,
            string memory courseName,
            string memory ipfsHash,
            bytes32 certificateHash,
            uint256 issuedDate,
            address issuer,
            bool isRevoked
        )
    {
        require(_id > 0 && _id <= certificateCount, "Invalid certificate ID");
        Certificate memory cert = certificates[_id];
        return (
            cert.studentName,
            cert.courseName,
            cert.ipfsHash,
            cert.certificateHash,
            uint256(cert.issuedDate),
            cert.issuer,
            cert.isRevoked
        );
    }

    function isAuthorizedIssuer(address _address) external view returns (bool) {
        return authorizedIssuers[_address];
    }
}
