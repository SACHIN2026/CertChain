# Certificate Revocation with IPFS Removal

## Overview
When you revoke a certificate, the system now performs **two actions**:
1. ✅ Marks certificate as REVOKED on blockchain
2. ✅ Unpins certificate from IPFS (removes from Pinata storage)

## How It Works

### Revocation Process (3 Steps)

**Step 1: Get Certificate Details**
- System retrieves the certificate from blockchain
- Extracts the IPFS hash

**Step 2: Revoke on Blockchain**
- Calls `revokeCertificate(id)` on smart contract
- Marks certificate as revoked permanently
- Transaction confirmed on Sepolia testnet

**Step 3: Remove from IPFS**
- Calls Pinata unpin API
- Removes certificate from your Pinata account
- Makes certificate harder to access

### User Flow

1. **Navigate to "Revoke Certificate" tab**
2. **Enter Certificate ID**
3. **Click "⚠️ Revoke Certificate"**
4. **Confirm Warning Dialog**:
   ```
   ⚠️ WARNING: This will revoke the certificate AND remove it from IPFS!
   
   Certificate ID: 5
   
   This action will:
   1. Mark the certificate as REVOKED on blockchain
   2. Unpin the certificate from IPFS (harder to access)
   
   The blockchain record will remain for audit purposes.
   
   Do you want to proceed?
   ```
5. **Wait for process** (shows 3 loading steps)
6. **See confirmation message**

## Technical Details

### Blockchain Revocation
```javascript
// Smart contract function
await contract.revokeCertificate(certificateId);
```

**Effect:**
- Sets `isRevoked = true` in certificate struct
- Permanent and immutable
- Verification returns "REVOKED" status

### IPFS Unpinning
```javascript
// Pinata API call
await axios.delete(
  `https://api.pinata.cloud/pinning/unpin/${ipfsHash}`,
  {
    headers: {
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_SECRET_KEY,
    },
  }
);
```

**Effect:**
- Removes pin from your Pinata account
- Certificate no longer guaranteed to be available
- Other IPFS nodes may still have cached copies (temporary)

## Important Notes

### ⚠️ What Gets Deleted
- ✅ Certificate **unpinned** from Pinata
- ❌ Certificate **NOT deleted** from IPFS network (impossible)
- ❌ Blockchain record **preserved** (for audit trail)

### 🔍 What Remains
1. **Blockchain Record**: 
   - Certificate ID, name, course, IPFS hash
   - Issue date, issuer address
   - Revocation status
   - All permanently recorded

2. **Audit Trail**:
   - Anyone can see certificate was revoked
   - Timestamp of revocation
   - Original IPFS hash (even if unpinned)

3. **IPFS Network**:
   - Other nodes may have temporary copies
   - Will eventually be garbage collected
   - Gateway access will fail (most cases)

### 🎯 Use Cases

**When to Revoke + Remove:**
- ✅ Certificate issued in error
- ✅ Student expelled/disqualified
- ✅ Fraud or forgery detected
- ✅ Policy violations
- ✅ Data privacy requests (GDPR)

**When NOT to Use:**
- ❌ Certificate expired (keep record)
- ❌ Minor corrections (issue new cert)
- ❌ Test certificates (delete from start)

## Security Considerations

### Why Not Complete Deletion?

1. **IPFS is Distributed**
   - Content spread across multiple nodes
   - No central deletion mechanism
   - Unpinning only affects YOUR node

2. **Blockchain is Immutable**
   - Cannot delete transaction history
   - Hash permanently recorded
   - Transparency requirement

3. **Legal/Audit Requirements**
   - May need proof of revocation
   - Audit trail for compliance
   - Historical record preservation

### Best Practices

1. **Verify Before Revoking**
   - Always check certificate details first
   - Confirm you have the correct ID
   - Consider issuing new certificate instead

2. **Document Reason**
   - Keep internal records of why revoked
   - May need to explain later
   - Compliance documentation

3. **Notify Stakeholders**
   - Inform certificate holder
   - Update relevant parties
   - Post public notice if needed

## Success/Error Messages

### ✅ Full Success
```
✅ Certificate revoked successfully!

Certificate ID: 5
IPFS Hash: QmXxx...

✓ Marked as REVOKED on blockchain
✓ Unpinned from IPFS storage

Transaction: 0xabc123...

Note: Blockchain record preserved for audit purposes.
```

### ⚠️ Partial Success (IPFS Failed)
```
⚠️ Certificate revoked with warning!

Certificate ID: 5

✓ Marked as REVOKED on blockchain
⚠️ Failed to unpin from IPFS (may still be accessible)

Transaction: 0xabc123...
```

### ❌ Complete Failure
```
Failed to revoke certificate.
[Error details]
```

## Verification After Revocation

### Using Verification Tab

**Method 1: By ID**
- Enter revoked certificate ID
- Result: ⚠️ "Certificate Revoked"
- Shows original details + revoked status

**Method 2: By File Hash**
- Upload certificate file (if you have it)
- Result: ⚠️ "Certificate exists but has been REVOKED"
- Hash matches blockchain

**Method 3: IPFS Access**
- Try accessing `https://gateway.pinata.cloud/ipfs/{hash}`
- Usually fails (unpinned)
- May work temporarily if cached elsewhere

## FAQ

### Q: Can I undo revocation?
**A:** No, blockchain revocation is permanent. You can issue a new certificate with a new ID.

### Q: Will the certificate file be completely deleted?
**A:** No, only unpinned from Pinata. Other IPFS nodes may temporarily retain copies until garbage collection.

### Q: Can holders still see their revoked certificate?
**A:** If they downloaded it, yes. But verification will show REVOKED status.

### Q: What if IPFS unpinning fails?
**A:** Certificate is still revoked on blockchain. File may remain accessible on IPFS gateways.

### Q: Can I revoke old certificates?
**A:** Yes, any certificate ID can be revoked if you're authorized.

### Q: Does revocation cost gas?
**A:** Yes, revocation requires a blockchain transaction (~50k gas).

## Code Example

### Revoke Function
```javascript
const revokeCertificate = async () => {
  // 1. Get certificate details
  const cert = await contract.verifyCertificate(certId);
  const ipfsHash = cert.ipfsHash;
  
  // 2. Revoke on blockchain
  const tx = await contract.revokeCertificate(certId);
  await tx.wait();
  
  // 3. Unpin from IPFS
  await axios.delete(
    `https://api.pinata.cloud/pinning/unpin/${ipfsHash}`,
    { headers: { /* API keys */ } }
  );
};
```

## Monitoring & Logs

### Browser Console Logs
```javascript
// Check console for:
Revoking certificate ID: 5
IPFS Hash: QmXxx...
Transaction sent: 0xabc...
Transaction confirmed
Successfully unpinned from IPFS: QmXxx...
```

### Check Pinata Dashboard
- Go to pinata.cloud
- Check "Pin Manager"
- Revoked certificate should be gone

### Check Etherscan
- Search transaction hash
- See `revokeCertificate` call
- Verify gas used and status

## Summary

✅ **Implemented**: Two-step revocation
✅ **Blockchain**: Permanent revocation record
✅ **IPFS**: Unpinning from Pinata
✅ **UI**: Clear warnings and confirmations
✅ **Feedback**: Detailed success/error messages

⚠️ **Note**: Complete deletion impossible due to IPFS distributed nature
🔒 **Security**: Audit trail preserved on blockchain
📝 **Best Practice**: Verify before revoking, document reasons

---

**Version**: 3.1
**Feature**: Revocation with IPFS Removal
**Status**: ✅ Implemented and Ready
