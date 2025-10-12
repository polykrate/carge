import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';
import { WalletSelector } from './WalletSelector';
import { LanguageSelector } from './LanguageSelector';

export const Header = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const {
    selectedAccount,
    selectedWallet,
    accounts,
    isWalletMenuOpen,
    isWalletSelectOpen,
    substrateConnected,
    ipfsReady,
    currentBlock,
    config,
    toggleWalletMenu,
    selectAccount,
    disconnectWallet,
    setIsWalletMenuOpen,
    setIsWalletSelectOpen,
  } = useApp();

  const isActive = (path) => location.pathname === path;

  const shortAddress = selectedAccount
    ? `${selectedAccount.substring(0, 6)}...${selectedAccount.substring(selectedAccount.length - 4)}`
    : t('wallet.connect');

  const polkadotJsUrl = `https://polkadot.js.org/apps/?rpc=${encodeURIComponent(config.SUBSTRATE_WS_URL)}`;

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-light">Carge</div>
            <span className="text-xs text-gray-400">Law as Code</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm">
            <Link
              to="/"
              className={isActive('/') ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'}
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/workflows"
              className={isActive('/workflows') ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'}
            >
              {t('nav.workflows')}
            </Link>
            <Link
              to="/quick-sign"
              className={isActive('/quick-sign') ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'}
            >
              {t('nav.quickSign')}
            </Link>
            <Link
              to="/verify"
              className={isActive('/verify') ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'}
            >
              {t('nav.verifyProof')}
            </Link>
            <Link
              to="/about"
              className={isActive('/about') ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'}
            >
              {t('nav.about')}
            </Link>
          </nav>

          {/* Right: Desktop Status & Wallet + Mobile Hamburger */}
          <div className="flex items-center space-x-4">
            {/* Desktop Status Indicators */}
            <div className="hidden md:flex items-center space-x-3 mr-4">
              {/* Substrate Block */}
              <a
                href={polkadotJsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-sm"
                title="Click to open Polkadot.js Apps"
              >
                <div className={`w-2 h-2 rounded-full ${substrateConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-gray-500 text-xs">{t('wallet.block')}</span>
                <span className="font-mono text-gray-900 text-xs">
                  {currentBlock ? `#${currentBlock}` : '-'}
                </span>
              </a>

              {/* IPFS */}
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm">
                <div className={`w-2 h-2 rounded-full ${ipfsReady ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                <span className="text-gray-500 text-xs">IPFS</span>
              </div>
              
              {/* Language Selector */}
              <LanguageSelector />
            </div>

            {/* Desktop Wallet Button */}
            <div className="relative hidden md:block">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🖱️ Wallet button clicked');
                  toggleWalletMenu();
                }}
                type="button"
                className="flex items-center space-x-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition font-medium text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>{shortAddress}</span>
              </button>

              {/* Wallet Selector */}
              {isWalletSelectOpen && <WalletSelector />}

              {/* Account Selector */}
              {isWalletMenuOpen && (
                <div className="absolute top-16 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="text-sm font-medium text-gray-900">
                      Select Account
                      {selectedWallet && (
                        <span className="ml-2 text-xs font-normal text-gray-500">({selectedWallet})</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">Choose your wallet account</div>
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    {accounts.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-500">
                        No accounts found
                        <br />
                        <span className="text-xs">Please authorize the extension</span>
                      </div>
                    ) : (
                      accounts.map((acc) => (
                        <button
                          key={acc.address}
                          onClick={() => selectAccount(acc.address)}
                          className={`w-full px-4 py-3 hover:bg-gray-50 transition text-left border-b border-gray-100 last:border-b-0 ${
                            selectedAccount === acc.address ? 'bg-gray-100' : ''
                          }`}
                        >
                          <div className="font-medium text-gray-900 text-sm">{acc.meta.name || 'Account'}</div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">
                            {acc.address.substring(0, 12)}...{acc.address.substring(acc.address.length - 8)}
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                    <button
                      onClick={disconnectWallet}
                      className="w-full px-3 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded transition font-medium mb-2"
                    >
                      Disconnect Wallet
                    </button>
                    <div className="text-xs text-gray-500 text-center">Powered by Polkadot.js Extension</div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 mt-4 pt-4 pb-2">
            {/* Mobile Navigation */}
            <nav className="flex flex-col space-y-2 mb-4">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className={`px-3 py-2 rounded-lg text-sm ${
                  isActive('/') ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t('nav.home')}
              </Link>
              <Link
                to="/workflows"
                onClick={closeMobileMenu}
                className={`px-3 py-2 rounded-lg text-sm ${
                  isActive('/workflows') ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t('nav.workflows')}
              </Link>
              <Link
                to="/quick-sign"
                onClick={closeMobileMenu}
                className={`px-3 py-2 rounded-lg text-sm ${
                  isActive('/quick-sign') ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t('nav.quickSign')}
              </Link>
              <Link
                to="/verify"
                onClick={closeMobileMenu}
                className={`px-3 py-2 rounded-lg text-sm ${
                  isActive('/verify') ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t('nav.verifyProof')}
              </Link>
              <Link
                to="/about"
                onClick={closeMobileMenu}
                className={`px-3 py-2 rounded-lg text-sm ${
                  isActive('/about') ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t('nav.about')}
              </Link>
            </nav>

            {/* Mobile Status Indicators */}
            <div className="flex items-center space-x-3 mb-4">
              {/* Substrate Block */}
              <a
                href={polkadotJsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-sm"
                title="Click to open Polkadot.js Apps"
              >
                <div className={`w-2 h-2 rounded-full ${substrateConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-gray-500 text-xs">{t('wallet.block')}</span>
                <span className="font-mono text-gray-900 text-xs">
                  {currentBlock ? `#${currentBlock}` : '-'}
                </span>
              </a>

              {/* IPFS */}
              <div className="flex-1 flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg text-sm">
                <div className={`w-2 h-2 rounded-full ${ipfsReady ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                <span className="text-gray-500 text-xs">IPFS</span>
              </div>
            </div>

            {/* Mobile Language Selector */}
            <div className="mb-4">
              <LanguageSelector />
            </div>

            {/* Mobile Wallet Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWalletMenu();
              }}
              type="button"
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition font-medium text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>{shortAddress}</span>
            </button>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {(isWalletMenuOpen || isWalletSelectOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsWalletMenuOpen(false);
            setIsWalletSelectOpen(false);
          }}
        ></div>
      )}
    </header>
  );
};

