import React from 'react';

function Header({ account, isConnected, connectWallet }) {
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* <CHANGE> Improved logo and branding section with better spacing */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">✓</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                CertChain
              </h1>
              <p className="text-xs text-slate-500">Blockchain Verification</p>
            </div>
          </div>
          
          {/* <CHANGE> Improved wallet status display with better styling */}
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-slate-700 font-mono">
                  {formatAddress(account)}
                </span>
              </div>
            ) : (
              <button 
                onClick={connectWallet} 
                className="px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;