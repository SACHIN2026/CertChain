const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateRegistry", function () {
  let certificateRegistry;
  let owner;
  let addr1;

  // Helper function to generate test hash
  const generateTestHash = (data) => {
    return ethers.keccak256(ethers.toUtf8Bytes(data));
  };

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
    certificateRegistry = await CertificateRegistry.deploy();
    await certificateRegistry.waitForDeployment();
  });

  describe("Certificate Issuance", function () {
    it("Should issue a certificate successfully", async function () {
      const certHash = generateTestHash("cert1");
      const tx = await certificateRegistry.issueCertificate(
        "John Doe",
        "Blockchain Development",
        "QmTestHash123",
        certHash
      );
      
      await tx.wait();
      
      const count = await certificateRegistry.certificateCount();
      expect(count).to.equal(1);
      
      const cert = await certificateRegistry.verifyCertificate(1);
      expect(cert.studentName).to.equal("John Doe");
      expect(cert.courseName).to.equal("Blockchain Development");
      expect(cert.ipfsHash).to.equal("QmTestHash123");
      expect(cert.isRevoked).to.equal(false);
    });

    it("Should increment certificate count", async function () {
      const hash1 = generateTestHash("cert_alice");
      const hash2 = generateTestHash("cert_bob");
      await certificateRegistry.issueCertificate("Alice", "Course A", "Hash1", hash1);
      await certificateRegistry.issueCertificate("Bob", "Course B", "Hash2", hash2);
      
      const count = await certificateRegistry.certificateCount();
      expect(count).to.equal(2);
    });

    it("Should emit CertificateIssued event", async function () {
      const certHash = generateTestHash("cert3");
      await expect(
        certificateRegistry.issueCertificate("Jane", "Web3", "Hash3", certHash)
      ).to.emit(certificateRegistry, "CertificateIssued");
    });

    it("Should prevent duplicate certificate hashes", async function () {
      const certHash = generateTestHash("duplicate");
      await certificateRegistry.issueCertificate("User1", "Course", "Hash", certHash);
      
      await expect(
        certificateRegistry.issueCertificate("User2", "Course", "Hash2", certHash)
      ).to.be.revertedWith("Certificate hash already exists");
    });
  });

  describe("Certificate Verification", function () {
    it("Should verify an existing certificate", async function () {
      const certHash = generateTestHash("test_cert");
      await certificateRegistry.issueCertificate(
        "Test User",
        "Smart Contracts",
        "QmHash456",
        certHash
      );
      
      const cert = await certificateRegistry.verifyCertificate(1);
      expect(cert.studentName).to.equal("Test User");
      expect(cert.courseName).to.equal("Smart Contracts");
      expect(cert.ipfsHash).to.equal("QmHash456");
      expect(cert.issuer).to.equal(owner.address);
      expect(cert.isRevoked).to.equal(false);
    });

    it("Should verify certificate by hash", async function () {
      const certHash = generateTestHash("hash_verify");
      await certificateRegistry.issueCertificate(
        "Student",
        "Course",
        "IpfsHash",
        certHash
      );
      
      const [exists, isValid] = await certificateRegistry.verifyCertificateByHash(certHash);
      expect(exists).to.equal(true);
      expect(isValid).to.equal(true);
    });

    it("Should revert for invalid certificate ID", async function () {
      await expect(
        certificateRegistry.verifyCertificate(999)
      ).to.be.revertedWith("Invalid certificate ID");
    });

    it("Should return correct certificate details", async function () {
      const certHash = generateTestHash("details_test");
      await certificateRegistry.issueCertificate(
        "Student Name",
        "Course Name",
        "IpfsHash",
        certHash
      );
      
      const details = await certificateRegistry.getCertificateDetails(1);
      expect(details.studentName).to.equal("Student Name");
      expect(details.courseName).to.equal("Course Name");
      expect(details.ipfsHash).to.equal("IpfsHash");
      expect(details.isRevoked).to.equal(false);
    });
  });

  describe("Admin & Authorization", function () {
    it("Should set deployer as admin", async function () {
      const admin = await certificateRegistry.admin();
      expect(admin).to.equal(owner.address);
    });

    it("Should allow admin to authorize issuers", async function () {
      await certificateRegistry.authorizeIssuer(addr1.address);
      const isAuthorized = await certificateRegistry.isAuthorizedIssuer(addr1.address);
      expect(isAuthorized).to.equal(true);
    });

    it("Should allow authorized issuer to issue certificates", async function () {
      await certificateRegistry.authorizeIssuer(addr1.address);
      const certHash = generateTestHash("authorized_cert");
      
      await expect(
        certificateRegistry.connect(addr1).issueCertificate("Name", "Course", "Hash", certHash)
      ).to.not.be.reverted;
    });

    it("Should prevent unauthorized addresses from issuing", async function () {
      const certHash = generateTestHash("unauthorized_cert");
      await expect(
        certificateRegistry.connect(addr1).issueCertificate("Name", "Course", "Hash", certHash)
      ).to.be.revertedWith("Not authorized to issue certificates");
    });
  });

  describe("Certificate Revocation", function () {
    it("Should allow revocation of certificates", async function () {
      const certHash = generateTestHash("revoke_test");
      await certificateRegistry.issueCertificate("Name", "Course", "Hash", certHash);
      
      await certificateRegistry.revokeCertificate(1);
      const cert = await certificateRegistry.verifyCertificate(1);
      expect(cert.isRevoked).to.equal(true);
    });

    it("Should show revoked status in hash verification", async function () {
      const certHash = generateTestHash("revoke_hash_test");
      await certificateRegistry.issueCertificate("Name", "Course", "Hash", certHash);
      
      await certificateRegistry.revokeCertificate(1);
      const [exists, isValid] = await certificateRegistry.verifyCertificateByHash(certHash);
      expect(exists).to.equal(true);
      expect(isValid).to.equal(false);
    });

    it("Should prevent revoking already revoked certificates", async function () {
      const certHash = generateTestHash("double_revoke");
      await certificateRegistry.issueCertificate("Name", "Course", "Hash", certHash);
      
      await certificateRegistry.revokeCertificate(1);
      await expect(
        certificateRegistry.revokeCertificate(1)
      ).to.be.revertedWith("Certificate already revoked");
    });
  });
});
