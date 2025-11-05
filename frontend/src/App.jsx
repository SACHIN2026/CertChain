import { useState, useEffect } from 'react';
import CertificateApp from './components/CertificateApp';
import Header from './components/Header';

function App() {
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setIsConnected(true);
        
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const expectedChainId = import.meta.env.VITE_CHAIN_ID || '0xaa36a7';
        
        if (chainId !== expectedChainId) {
          alert(`Please switch to ${import.meta.env.VITE_NETWORK_NAME || 'Sepolia'} network`);
        }
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet');
      }
    } else {
      alert('Please install MetaMask!');
      window.open('https://metamask.io/download/', '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header 
        account={account} 
        isConnected={isConnected} 
        connectWallet={connectWallet} 
      />
      
      <main className="container mx-auto px-6 py-12">
        {isConnected ? (
          <CertificateApp account={account} />
        ) : (
          /* <CHANGE> Improved welcome screen with cleaner design */
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-lg">
              <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-3xl">✓</span>
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Welcome to CertChain
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Decentralized Certificate Issuance & Verification on Blockchain
              </p>
              <button 
                onClick={connectWallet}
                className="px-8 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition"
              >
                Connect MetaMask to Get Started
              </button>
              <p className="text-sm text-slate-500 mt-6">
                Connect your wallet to issue and verify certificates on the blockchain
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;