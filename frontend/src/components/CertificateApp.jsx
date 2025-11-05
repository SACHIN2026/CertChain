import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { QRCodeCanvas } from 'qrcode.react';
import axios from 'axios';

import abi from '../CertificateRegistry.json';
import { generateSimpleCertificateHTML, generateCertificateFile } from '../templates/certificateTemplate';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY || '';
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY || '';

function CertificateApp({ account }) {
  const [name, setName] = useState('');
  const [course, setCourse] = useState('');
  const [certId, setCertId] = useState('');
  const [verified, setVerified] = useState(null);
  const [ipfsHash, setIpfsHash] = useState('');
  const [qrValue, setQrValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastIssuedId, setLastIssuedId] = useState('');
  const [activeTab, setActiveTab] = useState('verify');
  const [loadingStep, setLoadingStep] = useState('');
  const [verifyFile, setVerifyFile] = useState(null);
  
  // Role management
  const [userRole, setUserRole] = useState('student'); // 'admin' or 'student' - manual selection
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthorizedIssuer, setIsAuthorizedIssuer] = useState(false);
  const [revokeCertId, setRevokeCertId] = useState('');
  const [verifyMethod, setVerifyMethod] = useState('id'); // 'id' or 'hash'
  const [institutionName, setInstitutionName] = useState('');

  // Check blockchain authorization status (doesn't change userRole automatically)
  const checkBlockchainAuth = async () => {
    if (!window.ethereum || !account) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi.abi || abi, provider);
      
      // Check if user is authorized issuer
      const authorized = await contract.isAuthorizedIssuer(account);
      setIsAuthorizedIssuer(authorized);
      
      // Check if admin
      try {
        const adminAddress = await contract.admin();
        const isAdminUser = adminAddress.toLowerCase() === account.toLowerCase();
        setIsAdmin(isAdminUser);
      } catch (e) {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking blockchain authorization:', error);
      setIsAuthorizedIssuer(false);
      setIsAdmin(false);
    }
  };

  // Manual role switcher - user chooses their view mode
  const handleRoleSwitch = (newRole) => {
    setUserRole(newRole);
  };

  // Unpin file from IPFS (Pinata)
  const unpinFromIPFS = async (ipfsHash) => {
    try {
      await axios.delete(
        `https://api.pinata.cloud/pinning/unpin/${ipfsHash}`,
        {
          headers: {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_KEY,
          },
        }
      );
      console.log('Successfully unpinned from IPFS:', ipfsHash);
      return true;
    } catch (error) {
      console.error('Failed to unpin from IPFS:', error);
      return false;
    }
  };

  // Revoke certificate
  const revokeCertificate = async () => {
    if (!window.ethereum) {
      alert('MetaMask is not installed.');
      return;
    }

    if (!revokeCertId) {
      alert('Please enter a certificate ID to revoke.');
      return;
    }

    if (!isAuthorizedIssuer && !isAdmin) {
      alert('Only authorized issuers can revoke certificates.');
      return;
    }

    const confirmRevoke = window.confirm(
      `WARNING: This will revoke the certificate AND remove it from IPFS!\n\n` +
      `Certificate ID: ${revokeCertId}\n\n` +
      `This action will:\n` +
      `1. Mark the certificate as REVOKED on blockchain\n` +
      `2. Unpin the certificate from IPFS (harder to access)\n\n` +
      `The blockchain record will remain for audit purposes.\n\n` +
      `Do you want to proceed?`
    );

    if (!confirmRevoke) {
      return;
    }

    setLoading(true);
    setLoadingStep('Step 1/3: Getting certificate details...');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi.abi || abi, signer);
      
      // First, get the certificate to retrieve IPFS hash
      const cert = await contract.verifyCertificate(revokeCertId);
      const ipfsHash = cert.ipfsHash;
      
      console.log('Revoking certificate ID:', revokeCertId);
      console.log('IPFS Hash:', ipfsHash);
      
      // Step 1: Revoke on blockchain
      setLoadingStep('Step 2/3: Revoking certificate on blockchain...');
      const tx = await contract.revokeCertificate(revokeCertId);
      console.log('Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Transaction confirmed');

      // Step 2: Unpin from IPFS
      setLoadingStep('Step 3/3: Removing from IPFS storage...');
      const unpinned = await unpinFromIPFS(ipfsHash);
      
      setLoadingStep('');
      
      if (unpinned) {
        alert(
          `Certificate revoked successfully!\n\n` +
          `Certificate ID: ${revokeCertId}\n` +
          `IPFS Hash: ${ipfsHash}\n\n` +
          `- Marked as REVOKED on blockchain\n` +
          `- Unpinned from IPFS storage\n\n` +
          `Transaction: ${receipt.hash}\n\n` +
          `Note: Blockchain record preserved for audit purposes.`
        );
      } else {
        alert(
          `Certificate revoked with warning!\n\n` +
          `Certificate ID: ${revokeCertId}\n\n` +
          `- Marked as REVOKED on blockchain\n` +
          `- Failed to unpin from IPFS (may still be accessible)\n\n` +
          `Transaction: ${receipt.hash}`
        );
      }
      
      setRevokeCertId('');
    } catch (error) {
      console.error('Error revoking certificate:', error);
      setLoadingStep('');
      alert('Failed to revoke certificate. ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Run blockchain authorization check when account changes
  useEffect(() => {
    if (account && CONTRACT_ADDRESS) {
      checkBlockchainAuth();
    }
  }, [account]);

  // Compute hash of certificate data
  const computeHash = async (data) => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const uploadToIPFS = async (fileToUpload) => {
    if (!fileToUpload) {
      alert('No file to upload.');
      return null;
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      const res = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          maxBodyLength: 'Infinity',
          headers: {
            'Content-Type': 'multipart/form-data',
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_KEY,
          },
        }
      );
      return res.data.IpfsHash;
    } catch (error) {
      console.error('IPFS upload error:', error);
      alert('Failed to upload file to IPFS. Please check your connection.');
      return null;
    }
  };

  const issueCertificate = async () => {
    if (!window.ethereum) {
      alert('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    // Validate required fields
    if (!name || !course) {
      alert('Please fill in all required fields: Student Name and Course Name');
      return;
    }

    if (!CONTRACT_ADDRESS) {
      alert('Contract address not configured.');
      return;
    }

    setLoading(true);

    try {
      // Generate simple certificate HTML
      setLoadingStep('Step 1/4: Generating certificate...');
      const certHTML = generateSimpleCertificateHTML(name, course, institutionName);
      const certFile = generateCertificateFile(certHTML);
      
      setLoadingStep('Step 2/4: Uploading to IPFS...');
      const hash = await uploadToIPFS(certFile);
      if (!hash) {
        setLoading(false);
        setLoadingStep('');
        return;
      }

      setIpfsHash(hash);
      
      // Hash the actual certificate HTML content for verification
      setLoadingStep('Step 2.5/4: Computing certificate hash...');
      const certHash = await computeHash(certHTML);
      
      setLoadingStep('Step 3/4: Confirm transaction in MetaMask...');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi.abi || abi, signer);
      
      const tx = await contract.issueCertificate(name, course, hash, certHash);
      setLoadingStep('Step 4/4: Processing transaction on blockchain...');
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          return contract.interface.parseLog(log).name === 'CertificateIssued';
        } catch (e) {
          return false;
        }
      });

      let certificateId;
      if (event) {
        const parsed = contract.interface.parseLog(event);
        certificateId = parsed.args[0].toString();
      } else {
        certificateId = (await contract.certificateCount()).toString();
      }

      setLastIssuedId(certificateId);
      setQrValue(`https://ipfs.io/ipfs/${hash}`);
      setLoadingStep('');
      
      // Download the actual certificate HTML file for verification
      const certBlob = new Blob([certHTML], { type: 'text/html' });
      const certUrl = URL.createObjectURL(certBlob);
      const certLink = document.createElement('a');
      certLink.href = certUrl;
      certLink.download = `certificate-${certificateId}.html`;
      document.body.appendChild(certLink);
      certLink.click();
      document.body.removeChild(certLink);
      URL.revokeObjectURL(certUrl);

      alert(`Certificate issued successfully!\n\nCertificate ID: ${certificateId}\n\n- Certificate HTML file downloaded (use this for verification)\n\nView on Etherscan:\nhttps://sepolia.etherscan.io/tx/${receipt.hash}`);
      
      // Reset form fields
      setName('');
      setCourse('');
      setInstitutionName('');
    } catch (error) {
      console.error('Error issuing certificate:', error);
      setLoadingStep('');
      alert('Failed to issue certificate. ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  const verifyCertificate = async () => {
    if (!window.ethereum) {
      alert('MetaMask is not installed.');
      return;
    }

    if (verifyMethod === 'id' && !certId) {
      alert('Please enter a certificate ID.');
      return;
    }

    if (verifyMethod === 'hash' && !verifyFile) {
      alert('Please upload a certificate file to verify.');
      return;
    }

    if (!CONTRACT_ADDRESS) {
      alert('Contract address not configured.');
      return;
    }

    setLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi.abi || abi, provider);
      
      if (verifyMethod === 'id') {
        // Verify by ID
        const cert = await contract.verifyCertificate(certId);
        
        setVerified({
          method: 'ID',
          studentName: cert.studentName,
          courseName: cert.courseName,
          ipfsHash: cert.ipfsHash,
          issuedDate: new Date(Number(cert.issuedDate) * 1000).toLocaleString(),
          issuer: cert.issuer,
          isRevoked: cert.isRevoked,
          status: cert.isRevoked ? 'REVOKED' : 'VALID'
        });
        
        setQrValue(`https://ipfs.io/ipfs/${cert.ipfsHash}`);
      } else {
        // Verify by file hash - Compare uploaded file with IPFS stored certificate
        setLoadingStep('Step 1/3: Reading uploaded certificate...');
        
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const uploadedFileContent = e.target.result;
            
            // Compute hash of uploaded file
            setLoadingStep('Step 2/3: Computing file hash...');
            const uploadedHash = await computeHash(uploadedFileContent);
            console.log('Uploaded file hash:', uploadedHash);
            
            // Get all certificates to find matching hash
            setLoadingStep('Step 3/3: Comparing with blockchain records...');
            
            // Try to find certificate by checking if the hash exists
            const [exists, isValid] = await contract.verifyCertificateByHash(uploadedHash);
            
            if (exists) {
              // Hash found on blockchain
              setVerified({
                method: 'FILE',
                status: isValid ? 'VALID' : 'REVOKED',
                message: isValid 
                  ? 'Certificate is authentic and valid! The uploaded file matches the blockchain record.' 
                  : 'Certificate exists but has been REVOKED! File is authentic but no longer valid.',
                hash: uploadedHash,
                fileName: verifyFile.name
              });
            } else {
              // Hash not found - try fetching from IPFS using certificate ID if available
              // First check if we can get certificate details by ID
              if (certId) {
                try {
                  const cert = await contract.verifyCertificate(certId);
                  const ipfsHash = cert.ipfsHash;
                  
                  // Fetch certificate from IPFS
                  console.log('Fetching from IPFS:', ipfsHash);
                  const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
                  const ipfsResponse = await axios.get(ipfsUrl);
                  const ipfsContent = typeof ipfsResponse.data === 'string' 
                    ? ipfsResponse.data 
                    : JSON.stringify(ipfsResponse.data);
                  
                  // Compute hash of IPFS content
                  const ipfsFileHash = await computeHash(ipfsContent);
                  console.log('IPFS file hash:', ipfsFileHash);
                  
                  // Compare hashes
                  if (uploadedHash === ipfsFileHash) {
                    setVerified({
                      method: 'FILE',
                      status: cert.isRevoked ? 'REVOKED' : 'VALID',
                      message: cert.isRevoked
                        ? 'Certificate found and verified, but has been REVOKED!'
                        : 'Certificate is authentic! File matches IPFS record.',
                      hash: uploadedHash,
                      ipfsHash: ipfsHash,
                      fileName: verifyFile.name,
                      studentName: cert.studentName,
                      courseName: cert.courseName,
                      issuedDate: new Date(Number(cert.issuedDate) * 1000).toLocaleString()
                    });
                  } else {
                    setVerified({
                      method: 'FILE',
                      status: 'TAMPERED',
                      message: 'CERTIFICATE TAMPERED! The uploaded file does not match the IPFS record.',
                      hash: uploadedHash,
                      expectedHash: ipfsFileHash,
                      fileName: verifyFile.name
                    });
                  }
                } catch (ipfsError) {
                  console.error('IPFS fetch error:', ipfsError);
                  setVerified({
                    method: 'FILE',
                    status: 'INVALID',
                    message: 'Certificate not found or has been tampered with! Hash does not match any blockchain record.',
                    hash: uploadedHash,
                    fileName: verifyFile.name
                  });
                }
              } else {
                setVerified({
                  method: 'FILE',
                  status: 'INVALID',
                  message: 'Certificate not found! This file hash does not match any certificate on the blockchain.',
                  hash: uploadedHash,
                  fileName: verifyFile.name,
                  hint: 'Tip: If you have the certificate ID, enter it above to verify against IPFS.'
                });
              }
            }
            
            setLoadingStep('');
          } catch (err) {
            console.error('Error in file verification:', err);
            alert('Failed to verify certificate. ' + (err.reason || err.message));
            setVerified(null);
            setLoadingStep('');
          } finally {
            setLoading(false);
          }
        };
        
        reader.onerror = () => {
          alert('Failed to read file.');
          setVerified(null);
          setLoading(false);
          setLoadingStep('');
        };
        
        reader.readAsText(verifyFile);
        return; // Exit early to prevent finally block from running
      }
    } catch (error) {
      console.error('Error verifying certificate:', error);
      alert('Failed to verify certificate. ' + (error.reason || error.message));
      setVerified(null);
      setLoading(false);
    }
    
    // Only set loading to false for ID verification
    if (verifyMethod === 'id') {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Role Indicator */}
      <div className={`rounded-xl border-2 p-4 ${
        userRole === 'admin' 
          ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-300' 
          : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {userRole === 'admin' ? 'Admin / Issuer Mode' : 'Student / Verifier Mode'}
              </h3>
              <p className="text-sm text-slate-600">
                {userRole === 'admin' 
                  ? 'You can issue and revoke certificates' 
                  : 'You can only verify certificates'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Role Switcher Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-800">Switch View:</label>
              <select
                value={userRole}
                onChange={(e) => handleRoleSwitch(e.target.value)}
                className="px-4 py-2 bg-white border-2 border-slate-300 rounded-lg text-sm font-medium hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition cursor-pointer"
              >
                <option value="student">Student / Verifier</option>
                <option value="admin">Admin / Issuer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Authorization Status Indicator */}
        {userRole === 'admin' && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <span className="font-medium text-slate-700">Blockchain Authorization:</span>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  isAdmin 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {isAdmin ? 'Admin' : 'Not Admin'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  isAuthorizedIssuer 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {isAuthorizedIssuer ? 'Authorized Issuer' : 'Not Authorized'}
                </span>
              </div>
              {!isAdmin && !isAuthorizedIssuer && (
                <span className="text-xs text-orange-600 font-medium">
                  You need authorization to issue/revoke certificates
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('verify')}
          className={`px-6 py-3 text-sm font-medium transition border-b-2 ${
            activeTab === 'verify'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Verify Certificate
        </button>
        
        {userRole === 'admin' && (
          <>
            <button
              onClick={() => setActiveTab('issue')}
              className={`px-6 py-3 text-sm font-medium transition border-b-2 ${
                activeTab === 'issue'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Issue Certificate
            </button>
            <button
              onClick={() => setActiveTab('revoke')}
              className={`px-6 py-3 text-sm font-medium transition border-b-2 ${
                activeTab === 'revoke'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Revoke Certificate
            </button>
          </>
        )}
      </div>

      {/* Issue Certificate Tab */}
      {activeTab === 'issue' && (
        <div className="space-y-6">
          {/* Authorization Check */}
          {!isAuthorizedIssuer && !isAdmin ? (
            <div className="bg-white rounded-xl border-2 border-red-300 p-8 text-center">
              <div className="text-6xl mb-4 font-bold">�</div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                Access Restricted
              </h2>
              <p className="text-slate-600 mb-6">
                Only authorized issuers and administrators can issue certificates.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-left max-w-md mx-auto">
                <h4 className="font-semibold text-slate-900 mb-2">To become an authorized issuer:</h4>
                <ol className="text-sm text-slate-700 space-y-1 list-decimal list-inside">
                  <li>Contact the contract administrator</li>
                  <li>Provide your wallet address: <code className="bg-white px-2 py-1 rounded text-xs">{account}</code></li>
                  <li>Wait for authorization approval</li>
                  <li>Refresh this page after authorization</li>
                </ol>
              </div>
              <button
                onClick={checkUserRole}
                className="mt-6 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
              >
                Check Authorization Status
              </button>
            </div>
          ) : (
            <>
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">
              Issue New Certificate
            </h2>
            
            <div className="space-y-6">
              {/* Student Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Student Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                />
              </div>

              {/* Course Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Course/Certificate Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Blockchain Development"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                />
              </div>

              {/* Institution Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Institution/Organization Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., MIT, Google, TechCorp"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                />
                <p className="text-xs text-slate-500 mt-1">Optional - defaults to "Blockchain Certificate Authority"</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={issueCertificate}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Processing...' : 'Issue Certificate'}
                </button>
              </div>

              {loading && loadingStep && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                    <p className="text-sm font-medium text-blue-900">{loadingStep}</p>
                  </div>
                  <p className="text-xs text-blue-700 ml-8">
                    {loadingStep.includes('1/4') && 'Creating your professional certificate...'}
                    {loadingStep.includes('2/4') && 'Uploading to decentralized storage...'}
                    {loadingStep.includes('3/4') && 'Please confirm in MetaMask...'}
                    {loadingStep.includes('4/4') && 'Recording on blockchain (15-30 seconds)...'}
                  </p>
                </div>
              )}
            </div>

            {/* <CHANGE> Improved success message with better layout */}
            {lastIssuedId && qrValue && (
              <div className="mt-8 p-6 bg-emerald-50 border border-emerald-200 rounded-xl">
                <h3 className="text-lg font-semibold text-emerald-900 mb-4">
                  Certificate Issued Successfully
                </h3>
                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-xs text-emerald-700 font-semibold">CERTIFICATE ID</p>
                    <p className="text-sm font-mono text-emerald-900 break-all">{lastIssuedId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-700 font-semibold">IPFS HASH</p>
                    <a
                      href={`https://ipfs.io/ipfs/${ipfsHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-600 hover:underline font-mono"
                    >
                      {ipfsHash.substring(0, 30)}...
                    </a>
                  </div>
                </div>
                <div className="flex gap-6 items-center">
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <QRCodeCanvas value={qrValue} size={140} />
                  </div>
                  <div className="text-sm text-slate-600">
                    <p className="font-medium mb-2">Share this QR code or Certificate ID</p>
                    <p className="text-slate-500">Recipients can verify this certificate instantly</p>
                  </div>
                </div>
              </div>
            )}
          </div>
            </>
          )}
        </div>
      )}

      {/* Verify Certificate Tab */}
      {activeTab === 'verify' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">
              Verify Certificate
            </h2>

            {/* Verification Method Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Verification Method
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setVerifyMethod('id')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition ${
                    verifyMethod === 'id'
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  Verify by ID
                </button>
                <button
                  onClick={() => setVerifyMethod('hash')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition ${
                    verifyMethod === 'hash'
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  Verify by File Hash
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {verifyMethod === 'id' ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Certificate ID
                  </label>
                  <input
                    type="number"
                    placeholder="Enter certificate ID"
                    value={certId}
                    onChange={(e) => setCertId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Upload Certificate Metadata File
                  </label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => setVerifyFile(e.target.files[0])}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                  />
                  {verifyFile && (
                    <p className="mt-2 text-sm text-blue-600 font-medium">
                      Selected: {verifyFile.name}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
                    Upload the certificate file (HTML or PDF) to verify authenticity. The system will compute the file hash and compare it with the blockchain record.
                  </p>
                  <p className="mt-1 text-xs text-blue-600">
                    Tip: Enter the Certificate ID above for enhanced verification against IPFS
                  </p>
                </div>
              )}

              <button
                onClick={verifyCertificate}
                disabled={loading}
                className="w-full px-6 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Verifying...' : 'Verify Certificate'}
              </button>

              {/* Loading Steps Indicator */}
              {loading && loadingStep && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-blue-800 font-medium">{loadingStep}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Verification Results */}
            {verified && (
              <div className={`mt-8 p-6 border-2 rounded-xl ${
                verified.status === 'VALID' ? 'bg-emerald-50 border-emerald-300' :
                verified.status === 'REVOKED' ? 'bg-orange-50 border-orange-300' :
                'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    verified.status === 'VALID' ? 'bg-emerald-500' :
                    verified.status === 'REVOKED' ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}>
                    {verified.status === 'VALID' ? (
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : verified.status === 'REVOKED' ? (
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    ) : (
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {verified.status === 'VALID' ? 'Certificate Verified' :
                       verified.status === 'REVOKED' ? 'Certificate Revoked' :
                       'Certificate Invalid'}
                    </h3>
                    <p className="text-sm text-slate-600">
                      Verified by {verified.method}
                    </p>
                  </div>
                </div>

                {(verified.method === 'HASH' || verified.method === 'FILE') ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-900">{verified.message}</p>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">UPLOADED FILE</p>
                      <p className="text-sm text-slate-700">{verified.fileName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">FILE HASH</p>
                      <p className="font-mono text-xs text-slate-900 break-all">{verified.hash}</p>
                    </div>
                    {verified.expectedHash && (
                      <div>
                        <p className="text-xs text-slate-500 font-semibold">EXPECTED HASH (IPFS)</p>
                        <p className="font-mono text-xs text-red-700 break-all">{verified.expectedHash}</p>
                      </div>
                    )}
                    {verified.ipfsHash && (
                      <div>
                        <p className="text-xs text-slate-500 font-semibold">IPFS LOCATION</p>
                        <a
                          href={`https://gateway.pinata.cloud/ipfs/${verified.ipfsHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
                        >
                          View Original on IPFS →
                        </a>
                      </div>
                    )}
                    {verified.hint && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-xs text-blue-800">{verified.hint}</p>
                      </div>
                    )}
                    {verified.studentName && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-slate-500 font-semibold">STUDENT NAME</p>
                            <p className="text-sm font-medium text-slate-900">{verified.studentName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-semibold">COURSE NAME</p>
                            <p className="text-sm font-medium text-slate-900">{verified.courseName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-semibold">ISSUED DATE</p>
                            <p className="text-sm font-medium text-slate-900">{verified.issuedDate}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-slate-500 font-semibold">STATUS</p>
                        <p className={`text-sm font-bold ${
                          verified.status === 'VALID' ? 'text-emerald-700' :
                          verified.status === 'REVOKED' ? 'text-orange-700' :
                          'text-red-700'
                        }`}>{verified.status}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-slate-500 font-semibold">STUDENT NAME</p>
                        <p className="text-sm font-medium text-slate-900">{verified.studentName}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-slate-500 font-semibold">COURSE NAME</p>
                        <p className="text-sm font-medium text-slate-900">{verified.courseName}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-slate-500 font-semibold">ISSUED DATE</p>
                        <p className="text-sm font-medium text-slate-900">{verified.issuedDate}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-slate-500 font-semibold">ISSUER ADDRESS</p>
                        <p className="font-mono text-xs text-slate-900 break-all">
                          {verified.issuer}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-slate-500 font-semibold">CERTIFICATE FILE</p>
                        <a
                          href={`https://ipfs.io/ipfs/${verified.ipfsHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
                        >
                          View on IPFS →
                        </a>
                      </div>
                    </div>

                    {qrValue && (
                      <div className="flex justify-center items-center">
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                          <QRCodeCanvas value={qrValue} size={180} />
                          <p className="text-xs text-center text-slate-500 mt-2 font-medium">
                            Scan to view certificate
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revoke Certificate Tab */}
      {activeTab === 'revoke' && (isAuthorizedIssuer || isAdmin) && (
        <div className="space-y-6">
          {/* Warning Banner */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl font-bold text-orange-600">!</div>
              <div>
                <h3 className="font-semibold text-red-900 mb-2">
                  Certificate Revocation + IPFS Removal
                </h3>
                <p className="text-sm text-red-700 mb-2">
                  <strong>Warning:</strong> This will revoke the certificate AND remove it from IPFS storage!
                </p>
                <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
                  <li>Certificate marked as REVOKED on blockchain (permanent)</li>
                  <li>Certificate unpinned from IPFS (harder to access)</li>
                  <li>Blockchain record preserved for audit trail</li>
                  <li>Use only when necessary (fraud, errors, violations)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">
              Revoke Certificate
            </h2>
            
            <div className="space-y-6">
              {/* Certificate ID Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Certificate ID to Revoke
                </label>
                <input
                  type="number"
                  placeholder="Enter certificate ID"
                  value={revokeCertId}
                  onChange={(e) => setRevokeCertId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Tip: Verify the certificate first to ensure you're revoking the correct one
                </p>
              </div>

              {/* Revoke Button */}
              <button
                onClick={revokeCertificate}
                disabled={loading || !revokeCertId}
                className="w-full px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Revoke Certificate
                  </>
                )}
              </button>

              {/* Loading Steps Indicator */}
              {loading && loadingStep && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-600 border-t-transparent"></div>
                    <p className="text-sm font-medium text-red-900">{loadingStep}</p>
                  </div>
                  <p className="text-xs text-red-700 ml-8">
                    {loadingStep.includes('1/3') && 'Retrieving certificate information...'}
                    {loadingStep.includes('2/3') && 'Marking as revoked on blockchain...'}
                    {loadingStep.includes('3/3') && 'Removing from IPFS storage...'}
                  </p>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">
                  What happens when you revoke a certificate?
                </h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">1️⃣</span>
                    <span>Certificate marked as <strong>REVOKED</strong> on blockchain (permanent)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">2️⃣</span>
                    <span>Certificate file <strong>unpinned from IPFS</strong> (removed from Pinata storage)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">ℹ️</span>
                    <span>Blockchain record preserved for audit purposes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">ℹ️</span>
                    <span>Verification will show "Certificate Revoked" status</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500">!</span>
                    <span>This action is <strong>permanent</strong> and cannot be reversed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✔</span>
                    <span>Only admin and authorized issuers can revoke certificates</span>
                  </li>
                </ul>
              </div>

              {/* Quick Verify Section */}
              <div className="border-t pt-6">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">
                  Quick Verify Before Revoking
                </h4>
                <p className="text-sm text-slate-600 mb-3">
                  Enter a certificate ID to check its details before revoking:
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Certificate ID"
                    value={certId}
                    onChange={(e) => setCertId(e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <button
                    onClick={async () => {
                      setVerifyMethod('id');
                      await verifyCertificate();
                    }}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition"
                  >
                    Check Details
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Show verification result if exists */}
          {verified && verified.method === 'ID' && (
            <div className={`p-6 border-2 rounded-xl ${
              verified.status === 'VALID' ? 'bg-emerald-50 border-emerald-300' :
              'bg-orange-50 border-orange-300'
            }`}>
              <h4 className="font-semibold text-slate-900 mb-4">Certificate Details:</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 font-semibold">STUDENT NAME</p>
                  <p className="text-slate-900 font-medium">{verified.studentName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold">COURSE NAME</p>
                  <p className="text-slate-900 font-medium">{verified.courseName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold">STATUS</p>
                  <p className={`font-bold ${
                    verified.status === 'VALID' ? 'text-emerald-700' : 'text-orange-700'
                  }`}>{verified.status}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold">ISSUED DATE</p>
                  <p className="text-slate-900 font-medium">{verified.issuedDate}</p>
                </div>
              </div>
              {verified.status === 'VALID' && (
                <button
                  onClick={() => {
                    setRevokeCertId(certId);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
                >
                  Revoke This Certificate
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CertificateApp;