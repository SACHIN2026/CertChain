/**
 * Certificate HTML Template Generator
 * This file contains the certificate design and styling
 */

export const generateSimpleCertificateHTML = (studentName, courseName, institution) => {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Certificate</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Georgia, serif;
          background: #f3f4f6;
          padding: 0;
          margin: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .cert {
          width: 90vw;
          max-width: 1200px;
          aspect-ratio: 16/9;
          margin: auto;
          background: white;
          border: 3px solid #1e3a8a;
          padding: 3% 5%;
          position: relative;
          box-sizing: border-box;
        }
        .cert::before,
        .cert::after {
          content: "";
          position: absolute;
          left: 2%;
          right: 2%;
          height: 2px;
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
        }
        .cert::before {
          top: 1.5%;
        }
        .cert::after {
          bottom: 1.5%;
        }
        .hdr {
          text-align: center;
          margin-bottom: 2%;
        }
        .inst {
          font-size: clamp(20px, 2.5vw, 32px);
          font-weight: bold;
          color: #1e1e1e;
          margin-bottom: 0.5%;
          letter-spacing: 2px;
        }
        .ttl {
          font-size: clamp(10px, 1.2vw, 14px);
          letter-spacing: 3px;
          color: #3b82f6;
          font-weight: 600;
          margin-bottom: 2%;
        }
        .cnt {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          margin: 2% 0;
          min-height: auto;
        }
        .main {
          font-size: clamp(24px, 3.5vw, 42px);
          font-weight: bold;
          color: #1e1e1e;
          margin-bottom: 2%;
          text-transform: uppercase;
          letter-spacing: 4px;
        }
        .txt {
          font-size: clamp(12px, 1.4vw, 16px);
          color: #404040;
          margin-bottom: 1.5%;
          line-height: 1.5;
        }
        .nm {
          font-size: clamp(16px, 2vw, 24px);
          color: #3b82f6;
          font-weight: bold;
          margin: 1.5% 0;
          border-bottom: 2px solid #d4d4d8;
          padding-bottom: 0.5%;
        }
        .crs {
          font-size: clamp(12px, 1.5vw, 18px);
          color: #3b82f6;
          font-weight: 600;
          margin-top: 1%;
          border-bottom: 2px solid #d4d4d8;
          padding-bottom: 0.5%;
          display: inline-block;
          min-width: 300px;
        }
        .ftr {
          display: flex;
          justify-content: space-between;
          margin-top: 3%;
          gap: 5%;
          align-items: flex-end;
        }
        .sig,
        .seal {
          flex: 1;
          text-align: center;
        }
        .sigl {
          border-top: 2px solid #1e1e1e;
          padding-top: 2%;
          height: clamp(50px, 6vw, 70px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .sgsvg {
          width: clamp(100px, 12vw, 150px);
          height: clamp(40px, 5vw, 60px);
        }
        .lbl {
          font-size: clamp(9px, 1vw, 12px);
          color: #404040;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-top: 1%;
        }
        .dt {
          font-size: clamp(8px, 0.9vw, 11px);
          color: #666;
          margin-top: 0.5%;
        }
        .sl {
          width: clamp(70px, 8vw, 100px);
          height: clamp(70px, 8vw, 100px);
          margin: 0 auto 1%;
        }
        @media print {
          body {
            padding: 0;
            background: white;
          }
          .cert {
            border: 3px solid #1e3a8a;
            width: 100%;
            max-width: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="cert">
        <div class="hdr">
          <div class="inst">${institution || 'Blockchain Certificate Authority'}</div>
          <div class="ttl">CERTIFICATE OF COMPLETION</div>
        </div>
        <div class="cnt">
          <div class="main">CERTIFICATE</div>
          <div class="txt">This certificate is proudly awarded to</div>
          <div class="nm">${studentName}</div>
          <div class="txt">for successful completion of</div>
          <div class="crs">${courseName}</div>
        </div>
        <div class="ftr">
          <div class="sig">
            <div class="sigl">
              <svg class="sgsvg" viewBox="0 0 200 100">
                <path d="M20 60Q40 30 60 50T100 40T140 55T180 30" stroke="#1e1e1e" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </div>
            <div class="lbl">Authorized Signature</div>
            <div class="dt">Date: ${currentDate}</div>
          </div>
          <div class="seal">
            <svg class="sl" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="58" fill="none" stroke="#3b82f6" stroke-width="3"></circle>
              <circle cx="60" cy="60" r="50" fill="none" stroke="#3b82f6" stroke-width="1.5"></circle>
              <polygon points="60,15 70,45 100,45 77,62 85,92 60,75 35,92 43,62 20,45 50,45" fill="#3b82f6" opacity="0.8"></polygon>
              <text x="60" y="110" font-size="10" fill="#3b82f6" text-anchor="middle" font-weight="bold">CERTIFIED</text>
            </svg>
            <div class="lbl">Digital Seal</div>
            <div class="dt">Blockchain Verified</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Convert HTML to Blob for IPFS upload
 */
export const generateCertificateFile = (htmlContent) => {
  return new Blob([htmlContent], { type: 'text/html' });
};
