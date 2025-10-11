// ============================================================================
// IPFS CLIENT - Hybrid (Helia P2P + HTTP Gateway Fallback)
// ============================================================================

export class IpfsClient {
  constructor() {
    this.helia = null;
    this.fs = null;
    this.isReady = false;
    this.initPromise = null;
    
    // Public IPFS gateways (fallback) - Ordered by reliability
    this.gateways = [
      'https://ipfs.io/ipfs',
      'https://dweb.link/ipfs',
      'https://gateway.pinata.cloud/ipfs',
      'https://cloudflare-ipfs.com/ipfs',
      'https://ipfs.eth.aragon.network/ipfs',
      'https://gateway.ipfs.io/ipfs',
    ];
  }

  /**
   * Initialise Helia (en arrière-plan, non-bloquant)
   * @returns {Promise<boolean>}
   */
  async init() {
    // Si déjà en cours d'initialisation, retourner la promesse existante
    if (this.initPromise) {
      return this.initPromise;
    }

    // Si déjà initialisé
    if (this.isReady) {
      return true;
    }

    this.initPromise = this._initHelia();
    return this.initPromise;
  }

  async _initHelia() {
    try {
      console.log('🚀 Initializing Helia (P2P IPFS) with optimized config...');
      
      // Timeout de 10 secondes pour l'initialisation
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Helia init timeout')), 10000)
      );

      const initHelia = (async () => {
        // Import depuis les packages installés
        const { createHelia } = await import('helia');
        const { unixfs } = await import('@helia/unixfs');
        const { webSockets } = await import('@libp2p/websockets');
        const { bootstrap } = await import('@libp2p/bootstrap');

        // Configuration simplifiée pour navigateur
        const heliaConfig = {
          libp2p: {
            // Adresses d'écoute vides pour navigateur (pas de listen, juste dial out)
            addresses: {
              listen: []
            },
            // Transports compatibles navigateur
            transports: [
              webSockets()
            ],
            // Peer discovery avec bootstrap
            peerDiscovery: [
              bootstrap({
                list: [
                  // Bootstrap nodes WebSocket Secure (compatible navigateur)
                  '/dns4/node0.preload.ipfs.io/tcp/443/wss/p2p/QmZMxNdpMkewiVZLMRxaNxUeZpDUb34pWjZ1kZvsd16Zic',
                  '/dns4/node1.preload.ipfs.io/tcp/443/wss/p2p/Qmbut9Ywz9YEDrz8ySBSgWyJk41Uvm2QJPhwDJzJyGFsD6',
                  '/dns4/node2.preload.ipfs.io/tcp/443/wss/p2p/QmV7gnbW5VTcJ3oyM2Xk1rdFBJ3kTkvxc87UFGsun29STS',
                  '/dns4/node3.preload.ipfs.io/tcp/443/wss/p2p/QmY7JB6MQXhxHvq7dBDh4HpbH29v4yE9JRadAVpndvzySN',
                ]
              })
            ],
            // Connection Manager
            connectionManager: {
              maxConnections: 20,
              minConnections: 2,
            },
          },
          start: true,
        };

        console.log('🔧 Creating Helia with WebSocket transport...');
        this.helia = await createHelia(heliaConfig);
        this.fs = unixfs(this.helia);
        
        // Attendre un peu pour que les connexions se fassent
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Log des peers connectés
        const peers = this.helia.libp2p.getPeers();
        console.log(`✅ Helia ready with ${peers.length} peer(s) connected`);
        
        if (peers.length === 0) {
          console.warn('⚠️ No peers connected yet, but Helia is initialized');
        }
        
        this.isReady = true;
        return true;
      })();

      return await Promise.race([initHelia, timeout]);
    } catch (error) {
      console.warn('⚠️ Helia initialization failed or timed out:', error.message);
      console.log('📡 Will use HTTP gateway fallback');
      this.isReady = false;
      return false;
    }
  }

  /**
   * Télécharge depuis HTTP gateway (fallback)
   */
  async downloadViaGateway(cid, timeout = 20000) {
    const errors = [];

    for (const gateway of this.gateways) {
      try {
        console.log(`📡 Trying gateway: ${gateway}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(`${gateway}/${cid}`, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/octet-stream, text/plain, */*',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const text = await response.text();
        console.log(`✅ Downloaded ${text.length} bytes via gateway`);
        return text;
      } catch (error) {
        console.warn(`❌ Gateway ${gateway} failed:`, error.message);
        errors.push({ gateway, error: error.message });
        // Petit délai avant d'essayer le prochain gateway
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
    }

    throw new Error(`All gateways failed: ${JSON.stringify(errors)}`);
  }

  /**
   * Télécharge du texte depuis un CID (avec fallback automatique)
   * @param {string} cid - CID IPFS
   * @returns {Promise<string>}
   */
  async downloadText(cid) {
    console.log(`📥 Downloading CID: ${cid}`);

    // Essayer Helia en premier (si disponible)
    if (this.isReady && this.fs) {
      try {
        // Log du nombre de peers
        const peers = this.helia?.libp2p?.getPeers() || [];
        console.log(`🔄 Attempting P2P download via Helia (${peers.length} peers)...`);
        
        const decoder = new TextDecoder();
        let content = '';

        // Timeout de 15 secondes pour Helia (plus de temps pour trouver les peers)
        const downloadPromise = (async () => {
          for await (const chunk of this.fs.cat(cid)) {
            content += decoder.decode(chunk, { stream: true });
          }
          return content;
        })();

        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Helia download timeout')), 15000)
        );

        content = await Promise.race([downloadPromise, timeout]);
        
        console.log(`✅ Downloaded ${content.length} bytes via Helia (P2P)`);
        return content;
      } catch (error) {
        console.warn('⚠️ Helia download failed:', error.message);
        console.log('📡 Falling back to HTTP gateway...');
      }
    } else {
      console.log('⚠️ Helia not ready, using HTTP gateway directly');
    }

    // Fallback sur gateway HTTP
    return await this.downloadViaGateway(cid);
  }

  /**
   * Télécharge un fichier binaire
   * @param {string} cid - CID IPFS
   * @returns {Promise<Uint8Array>}
   */
  async downloadFile(cid) {
    console.log(`📥 Downloading file CID: ${cid}`);

    // Essayer Helia
    if (this.isReady && this.fs) {
      try {
        const chunks = [];
        
        const downloadPromise = (async () => {
          for await (const chunk of this.fs.cat(cid)) {
            chunks.push(chunk);
          }
        })();

        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 8000)
        );

        await Promise.race([downloadPromise, timeout]);

        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }

        console.log(`✅ Downloaded ${result.length} bytes via Helia`);
        return result;
      } catch (error) {
        console.warn('⚠️ Helia download failed, using gateway');
      }
    }

    // Fallback gateway
    const text = await this.downloadViaGateway(cid);
    return new TextEncoder().encode(text);
  }

  /**
   * Télécharge et parse un JSON
   * @param {string} cid - CID IPFS
   * @returns {Promise<Object>}
   */
  async downloadJson(cid) {
    const text = await this.downloadText(cid);
    return JSON.parse(text);
  }

  /**
   * Arrête Helia proprement
   */
  async stop() {
    if (this.helia) {
      console.log('🛑 Stopping Helia...');
      await this.helia.stop();
      this.isReady = false;
      console.log('✅ Helia stopped');
    }
  }

  /**
   * Vérifie si Helia P2P est prêt
   * @returns {boolean}
   */
  get ready() {
    return this.isReady;
  }
}
