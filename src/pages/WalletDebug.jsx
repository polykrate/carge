import { useState, useEffect } from 'react';

export const WalletDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    // Wait for potential injection
    setTimeout(() => {
      const info = {
        // User Agent
        userAgent: navigator.userAgent,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        
        // CDN Scripts
        polkadotUtil: !!window.polkadotUtil,
        polkadotUtilCrypto: !!window.polkadotUtilCrypto,
        polkadotExtensionDapp: !!window.polkadotExtensionDapp,
        
        // Injected Web3
        injectedWeb3: !!window.injectedWeb3,
        injectedWeb3Keys: window.injectedWeb3 ? Object.keys(window.injectedWeb3) : [],
        
        // Check specific wallet injections
        walletInjections: {
          'polkadot-js': !!(window.injectedWeb3 && window.injectedWeb3['polkadot-js']),
          'subwallet-js': !!(window.injectedWeb3 && window.injectedWeb3['subwallet-js']),
          'talisman': !!(window.injectedWeb3 && window.injectedWeb3['talisman']),
        },
        
        // Nova Wallet specific
        novaWallet: !!window.nova,
        novaWalletKeys: window.nova ? Object.keys(window.nova) : [],
        
        // SubWallet specific  
        subWallet: !!window.SubWallet,
        subWalletKeys: window.SubWallet ? Object.keys(window.SubWallet) : [],
        
        // Check if we're in a wallet browser
        isNovaWalletBrowser: navigator.userAgent.includes('Nova'),
        isSubWalletBrowser: navigator.userAgent.includes('SubWallet'),
        
        // Try to access extension-dapp functions
        web3EnableAvailable: !!(window.polkadotExtensionDapp && window.polkadotExtensionDapp.web3Enable),
        web3AccountsAvailable: !!(window.polkadotExtensionDapp && window.polkadotExtensionDapp.web3Accounts),
        web3FromAddressAvailable: !!(window.polkadotExtensionDapp && window.polkadotExtensionDapp.web3FromAddress),
      };
      
      setDebugInfo(info);
    }, 2000); // Wait 2s for injection
  }, []);

  const testWeb3Enable = async () => {
    try {
      if (!window.polkadotExtensionDapp) {
        alert('❌ window.polkadotExtensionDapp not found');
        return;
      }
      
      const { web3Enable } = window.polkadotExtensionDapp;
      const extensions = await web3Enable('Carge Debug');
      
      alert(`✅ web3Enable success!\nFound ${extensions.length} extensions:\n${extensions.map(e => e.name).join('\n')}`);
      
      // Update debug info
      setDebugInfo(prev => ({
        ...prev,
        web3EnableTest: 'SUCCESS',
        extensionsFound: extensions.length,
        extensionNames: extensions.map(e => e.name)
      }));
    } catch (error) {
      alert(`❌ web3Enable failed:\n${error.message}`);
      setDebugInfo(prev => ({
        ...prev,
        web3EnableTest: 'FAILED',
        web3EnableError: error.message
      }));
    }
  };

  const testWeb3Accounts = async () => {
    try {
      if (!window.polkadotExtensionDapp) {
        alert('❌ window.polkadotExtensionDapp not found');
        return;
      }
      
      const { web3Enable, web3Accounts } = window.polkadotExtensionDapp;
      
      // Must enable first
      await web3Enable('Carge Debug');
      
      const accounts = await web3Accounts();
      alert(`✅ web3Accounts success!\nFound ${accounts.length} accounts`);
      
      setDebugInfo(prev => ({
        ...prev,
        web3AccountsTest: 'SUCCESS',
        accountsFound: accounts.length
      }));
    } catch (error) {
      alert(`❌ web3Accounts failed:\n${error.message}`);
      setDebugInfo(prev => ({
        ...prev,
        web3AccountsTest: 'FAILED',
        web3AccountsError: error.message
      }));
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <h1 className="text-4xl font-light mb-4">Wallet Debug</h1>
      <p className="text-gray-600 mb-8">Diagnostic des wallets mobiles</p>

      {/* Action Buttons */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-medium mb-4">Tests Interactifs</h2>
        <div className="space-y-2">
          <button
            onClick={testWeb3Enable}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
          >
            Test web3Enable()
          </button>
          <button
            onClick={testWeb3Accounts}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
          >
            Test web3Accounts()
          </button>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-medium mb-4">Environment Info</h2>
        <div className="space-y-2">
          <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-medium text-yellow-900 mb-2">Instructions</h3>
        <ul className="text-sm text-yellow-800 space-y-2 list-disc list-inside">
          <li>Sur mobile, ouvrez cette page depuis le navigateur in-app de votre wallet (Nova, SubWallet)</li>
          <li>Attendez 2 secondes pour que l'info se charge</li>
          <li>Cliquez sur les boutons de test</li>
          <li>Copiez toute l'info et envoyez-la moi</li>
        </ul>
      </div>
    </div>
  );
};

