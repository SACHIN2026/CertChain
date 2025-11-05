# Blockchain Certificate Issuance & Verification System

A decentralized web application that allows institutions to issue tamper-proof certificates using blockchain and IPFS with cryptographic hash verification.

## New Contract Address
**0x2Ee60749C4D52C9A4E8553eFF20e271BeA137f3d** (Sepolia Testnet)

## Features Implemented

### 1. Admin/Role Management
- Admin role automatically assigned to contract deployer
- Authorize multiple issuers to issue certificates
- Revoke issuer permissions
- Only authorized addresses can issue certificates

### 2. Certificate Issuance
- Student name, course name, and certificate details
- Automatic IPFS upload for certificate files
- SHA-256 hash computation for tamper detection
- Blockchain storage with unique certificate ID
- Duplicate hash prevention
- QR code generation for easy sharing

### 3. Three Verification Methods

#### A. Verify by Certificate ID
- Enter certificate ID to retrieve full details
- View student name, course, issue date, issuer
- Check revocation status
- Access original file on IPFS
- **Use case**: When you have the certificate ID

#### B. Verify by File Hash (Direct)
- Upload certificate file (HTML/PDF)
- System computes SHA-256 hash automatically
- Compares with blockchain records
- Instant tamper detection
- **Use case**: Quick verification without ID

#### C. Enhanced IPFS Verification
- Upload certificate file + enter certificate ID
- Fetches original from IPFS
- Compares uploaded file with IPFS original
- Detects sophisticated tampering
- Shows full certificate details
- **Use case**: Thorough verification with tamper proof

### 4. Certificate Revocation
- Authorized issuers can revoke certificates
- Revoked certificates marked as invalid
- Revocation status visible during verification
- Immutable revocation history on blockchain

### 5. Enhanced Security
- Cryptographic hash verification (SHA-256)
- Prevents certificate duplication
- Tamper-proof storage on blockchain
- Decentralized file storage (IPFS)

## Technology Stack

- **Blockchain**: Ethereum Sepolia Testnet
- **Smart Contract**: Solidity 0.8.20
- **Frontend**: React.js + Vite
- **Web3**: Ethers.js v6
- **Storage**: IPFS (via Pinata)
- **Styling**: Tailwind CSS
- **Hash Algorithm**: SHA-256

## How It Works

### Issuing Certificates
1. Admin enters student details and uploads certificate file
2. File uploaded to IPFS, CID generated
3. Certificate data hashed using SHA-256
4. Smart contract stores: name, course, IPFS CID, hash, timestamp
5. Unique certificate ID returned
6. QR code generated for sharing

### Verifying Certificates

#### Method 1: By Certificate ID
1. Enter certificate ID
2. Smart contract retrieves certificate data
3. Display: student name, course, date, issuer, status
4. Show IPFS link and QR code
5. Result: Valid or Revoked

#### Method 2: By File Hash (Direct)
1. Upload certificate file (HTML/PDF)
2. System computes SHA-256 hash automatically
3. Checks if hash exists on blockchain
4. Result: Valid, Revoked, or Invalid (not found)

#### Method 3: Enhanced IPFS Verification
1. Upload certificate file + enter certificate ID
2. Fetches original certificate from IPFS
3. Computes hash of both files
4. Compares uploaded vs. IPFS original
5. Shows full certificate details if match
6. Result: Valid, Revoked, Tampered, or Invalid

## Smart Contract Functions

\\\solidity
// Admin Functions
- authorizeIssuer(address)  // Add authorized issuer
- revokeIssuer(address)     // Remove issuer authorization

// Issue Certificate
- issueCertificate(name, course, ipfsHash, certHash) // Returns certificate ID

// Revoke Certificate
- revokeCertificate(id)     // Mark certificate as revoked

// Verify Certificate
- verifyCertificate(id)             // Get certificate details by ID
- verifyCertificateByHash(hash)     // Verify by cryptographic hash
- getCertificateDetails(id)         // Get full certificate info
- isAuthorizedIssuer(address)       // Check if address can issue
\\\

## Setup Instructions

### 1. Install Dependencies
\\\ash
npm install
cd frontend && npm install
\\\

### 2. Configure Environment
Create \.env\ in root:
\\\
SEPOLIA_RPC_URL=your_rpc_url
PRIVATE_KEY=your_private_key
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret
\\\

### 3. Deploy Contract (if needed)
\\\ash
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
\\\

### 4. Start Frontend
\\\ash
cd frontend
npm run dev
\\\

### 5. Configure MetaMask
- Network: Sepolia Testnet
- Chain ID: 11155111
- Get test ETH from faucets

## Usage

### For Institutions (Admin)
1. Connect wallet (must be authorized issuer)
2. Go to 'Issue Certificate' tab
3. Fill in student details
4. Upload certificate file (PDF, image, etc.)
5. Click 'Issue Certificate'
6. Share certificate ID with student

### For Students/Recipients
1. Receive certificate ID from institution
2. Can verify anytime using ID
3. Can download from IPFS
4. Can share QR code

### For Verifiers
**Option 1: Verify by ID**
1. Go to 'Verify Certificate' tab
2. Select 'Verify by ID'
3. Enter certificate ID
4. View full certificate details and status

**Option 2: Verify by File**
1. Go to 'Verify Certificate' tab
2. Select 'Verify by File Hash'
3. Upload certificate file
4. Instant verification result (Valid/Revoked/Invalid)

## Security Features

### Cryptographic Security
-  **SHA-256 Hashing**: Industry-standard cryptographic hash function
-  **Tamper Detection**: Any file modification changes hash completely
-  **Duplicate Prevention**: Same certificate cannot be issued twice

### Access Control
-  **Role-Based Access**: Admin and authorized issuer roles
-  **Authorization System**: Only authorized addresses can issue
-  **Revocation Rights**: Issuers can revoke their certificates

### Data Integrity
-  **Blockchain Immutability**: Records cannot be altered
-  **IPFS Redundancy**: Files stored across distributed network
-  **Hash Verification**: Three-tier verification system

### Advanced Verification
-  **Direct Hash Comparison**: Upload file, instant verification
-  **IPFS Cross-Check**: Compare uploaded vs. original
-  **Tamper Detection**: Identifies even minor modifications

## Advantages Over Traditional Systems

| Feature | Traditional | This System |
|---------|-------------|-------------|
| Tampering | Easy | Impossible (detected instantly) |
| Verification | Contact institution | Instant, anyone can verify |
| Storage | Centralized | Decentralized (IPFS) |
| Trust | Single authority | Blockchain consensus |
| Revocation | Difficult to track | Transparent on blockchain |
| Cost | High infrastructure | Low (only gas fees) |

## Verification System Details

### Three Verification Modes Explained

#### 🔍 Mode 1: Fast Hash Verification
**When to use**: Quick authentication check
**Process**:
1. Upload certificate file (HTML/PDF)
2. System computes SHA-256 hash
3. Checks blockchain for hash existence
4. Returns: VALID, REVOKED, or INVALID

**Speed**: 2-3 seconds
**Requirements**: Certificate file only

#### 🔍 Mode 2: Enhanced IPFS Verification  
**When to use**: Thorough tamper detection
**Process**:
1. Upload certificate file + enter certificate ID
2. Fetches original from IPFS
3. Compares uploaded vs. IPFS file hashes
4. Returns full certificate details

**Speed**: 5-10 seconds
**Requirements**: Certificate file + ID
**Detects**: File modifications, replacements, forgeries

#### 🔍 Mode 3: ID-Only Verification
**When to use**: When you only have the ID
**Process**:
1. Enter certificate ID
2. Retrieves from blockchain
3. Shows all certificate details

**Speed**: 2-3 seconds
**Requirements**: Certificate ID only
**Shows**: Full details, IPFS link, QR code

### Verification Results Explained

| Status | Meaning | Visual |
|--------|---------|--------|
| ✅ VALID | Certificate is authentic and active | Green background |
| ⚠️ REVOKED | Certificate was valid but revoked by issuer | Orange background |
| ❌ INVALID | Certificate not found on blockchain | Red background |
| ❌ TAMPERED | File was modified (hash mismatch) | Red background |

## Documentation

- **VERIFICATION_GUIDE.md**: Comprehensive verification manual
- **QUICK_START_TESTING.md**: Step-by-step testing guide
- **RBAC_REVOCATION_GUIDE.md**: Admin and role management
- **VERIFICATION_UPDATE_CHANGELOG.md**: Technical implementation details

## Contract on Sepolia
- Address: 0x2Ee60749C4D52C9A4E8553eFF20e271BeA137f3d
- View on Etherscan: https://sepolia.etherscan.io/address/0x2Ee60749C4D52C9A4E8553eFF20e271BeA137f3d
- Etherscan: https://sepolia.etherscan.io/address/0x2Ee60749C4D52C9A4E8553eFF20e271BeA137f3d

## License
MIT
