/**
 * Stellar Journey - Web3 Wallet Authentication & Constellation Animation
 */
document.addEventListener('DOMContentLoaded', () => {
    // -----------------------------------------------------------------
    // Part 1: Constellation Particle Background Animation
    // -----------------------------------------------------------------
    const canvas = document.getElementById('stars-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    const maxParticles = 90;
    const connectionDistance = 120;
    let mouse = { x: null, y: null, radius: 150 };
    // Set canvas dimensions
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    // Track mouse coordinates
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });
    // Particle Class
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
            this.radius = Math.random() * 2 + 1;
            // Pulsing star intensity
            this.alpha = Math.random();
            this.pulseSpeed = Math.random() * 0.02 + 0.005;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            // Bounce on boundaries
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            // Pulse opacity
            this.alpha += this.pulseSpeed;
            if (this.alpha <= 0.1 || this.alpha >= 0.9) {
                this.pulseSpeed *= -1;
            }
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 240, 255, ${this.alpha})`;
            ctx.shadowBlur = this.radius * 2;
            ctx.shadowColor = '#00f0ff';
            ctx.fill();
            ctx.shadowBlur = 0; // Reset shadow for line performance
        }
    }
    // Initialize particles
    function initParticles() {
        particles = [];
        for (let i = 0; i < maxParticles; i++) {
            particles.push(new Particle());
        }
    }
    initParticles();
    // Re-initialize particles on window resize to distribute them
    window.addEventListener('resize', () => {
        initParticles();
    });
    // Animation Loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw and update particles
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        // Draw connection lines (Constellations)
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < connectionDistance) {
                    const alpha = (1 - dist / connectionDistance) * 0.12;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(173, 0, 255, ${alpha})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
            // Mouse interaction constellation
            if (mouse.x !== null && mouse.y !== null) {
                const dx = particles[i].x - mouse.x;
                const dy = particles[i].y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < mouse.radius) {
                    const alpha = (1 - dist / mouse.radius) * 0.18;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
    // -----------------------------------------------------------------
    // Part 2: Navigation & Mobile Responsiveness
    // -----------------------------------------------------------------
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('open');
        mobileToggle.classList.toggle('active');
    });
    // Close menu when clicking links
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('open');
            mobileToggle.classList.remove('active');
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
    // -----------------------------------------------------------------
    // Part 3: Web3 MetaMask Wallet Integration
    // -----------------------------------------------------------------
    const btnConnect = document.getElementById('btn-connect');
    const btnDisconnect = document.getElementById('btn-disconnect');
    const connectText = document.getElementById('connect-text');
    const walletInfo = document.getElementById('wallet-info');
    const walletAddress = document.getElementById('wallet-address');
    const walletBalance = document.getElementById('wallet-balance');
    const heroConnectBtn = document.getElementById('hero-connect-btn');
    const heroWalletPanel = document.getElementById('hero-wallet-panel');
    const heroWalletAddress = document.getElementById('hero-wallet-address');
    const heroWalletBalance = document.getElementById('hero-wallet-balance');
    const networkBadge = document.getElementById('network-badge');
    const copyAddressBtn = document.getElementById('copy-address-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalActionBtn = document.getElementById('modal-action-btn');
    // Status Cards references
    const statusCards = [
        document.getElementById('status-card-1'),
        document.getElementById('status-card-2'),
        document.getElementById('status-card-3')
    ];
    let currentAccount = null;
    let isConnecting = false;
    // Popular networks list
    const CHAIN_NAMES = {
        '0x1': 'Ethereum',
        '0x5': 'Goerli Testnet',
        '0xaa36a7': 'Sepolia Testnet',
        '0x89': 'Polygon',
        '0x13881': 'Mumbai Testnet',
        '0xa4b1': 'Arbitrum',
        '0xa': 'Optimism',
        '0x2105': 'Base',
        '0x539': 'Localhost'
    };
    // Helper: Shorten Address
    function shortenAddress(addr) {
        if (!addr) return '';
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    }
    // Helper: Toast Notifications
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Define icons
        let iconSvg = '';
        if (type === 'success') {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        } else if (type === 'error') {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
        } else if (type === 'warning') {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
        } else {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
        }
        toast.innerHTML = `
            ${iconSvg}
            <span class="toast-message">${message}</span>
        `;
        
        container.appendChild(toast);
        // Remove toast after 4s
        setTimeout(() => {
            toast.classList.add('fade-out');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 4000);
    }
    // Modal Control Helper
    function showModal(title, message, btnText = '', btnUrl = '') {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        if (btnText && btnUrl) {
            modalActionBtn.textContent = btnText;
            modalActionBtn.href = btnUrl;
            modalActionBtn.classList.remove('hidden');
        } else {
            modalActionBtn.classList.add('hidden');
        }
        modalOverlay.classList.remove('hidden');
    }
    function closeModal() {
        modalOverlay.classList.add('hidden');
    }
    modalClose.addEventListener('click', closeModal);
    modalCloseBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    // Check MetaMask/Web3 installation
    function checkMetaMaskInstalled() {
        // Return true if window.ethereum exists (either MetaMask or other compliant wallets)
        return typeof window.ethereum !== 'undefined';
    }
    // Check if running on file:// protocol
    function isFileProtocol() {
        return window.location.protocol === 'file:';
    }
    // Check if user is on a mobile device
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    // Fetch account details: balance and chain name
    async function updateWalletDetails(account) {
        try {
            // Get Balance
            const balanceHex = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [account, 'latest']
            });
            const balanceWei = BigInt(balanceHex);
            // Format to standard ETH
            const balanceEth = Number(balanceWei) / 1e18;
            const displayBal = `${balanceEth.toFixed(4)} ETH`;
            // Get Chain Id
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const chainName = CHAIN_NAMES[chainId] || 'Unknown Network';
            // Update Header Wallet Card
            walletAddress.textContent = shortenAddress(account);
            walletBalance.textContent = balanceEth.toFixed(2) + ' ETH';
            // Update Hero Wallet Panel
            heroWalletAddress.textContent = account;
            heroWalletBalance.textContent = displayBal;
            networkBadge.textContent = chainName;
            // Set logged-in state UI
            setConnectionUI(true);
        } catch (error) {
            console.error('Error fetching wallet stats:', error);
            showToast('Failed to fetch wallet stats', 'error');
        }
    }
    // Toggle UI States
    function setConnectionUI(connected) {
        if (connected) {
            // Navigation
            btnConnect.classList.add('hidden');
            walletInfo.classList.remove('hidden');
            // Hero
            heroConnectBtn.classList.add('hidden');
            heroWalletPanel.classList.remove('hidden');
            // Features Unlocks
            statusCards.forEach((status, idx) => {
                status.className = "card-status unlocked";
                status.textContent = `🚀 Level ${idx + 1} Unlocked`;
            });
        } else {
            // Navigation
            btnConnect.classList.remove('hidden');
            walletInfo.classList.add('hidden');
            connectText.textContent = "Connect Wallet";
            // Hero
            heroConnectBtn.classList.remove('hidden');
            heroWalletPanel.classList.add('hidden');
            // Features Unlocks
            statusCards.forEach((status, idx) => {
                status.className = "card-status locked";
                status.textContent = "Requires Wallet Connection";
            });
        }
    }
    // Connect Wallet Handler
    async function connectWallet() {
        if (isConnecting) return;
        if (!checkMetaMaskInstalled()) {
            if (isFileProtocol()) {
                showModal(
                    'Local File Access Detected',
                    'MetaMask does not inject wallets into local files (file://) by default. Please open http://localhost:8080 in your browser, or enable "Allow access to file URLs" in MetaMask -> Details.'
                );
            } else if (isMobileDevice()) {
                // Construct the MetaMask deep link (launches the website inside MetaMask app browser)
                const dappUrl = window.location.host + window.location.pathname;
                const deepLink = `https://metamask.app.link/dapp/${dappUrl}`;
                showModal(
                    'Open in MetaMask App',
                    'To connect your wallet on mobile, please open this site inside the MetaMask app\'s built-in Web3 browser.',
                    'Open MetaMask App',
                    deepLink
                );
            } else {
                showModal(
                    'Wallet Not Found',
                    'We couldn\'t detect MetaMask or any other Web3 wallet in your browser. Please install MetaMask to interact with Web3 features.',
                    'Install MetaMask',
                    'https://metamask.io/download/'
                );
            }
            return;
        }
        isConnecting = true;
        connectText.textContent = "Connecting...";
        try {
            showToast('Opening MetaMask connection prompt...', 'info');
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            if (accounts.length > 0) {
                currentAccount = accounts[0];
                localStorage.setItem('wallet_connected', 'true');
                await updateWalletDetails(currentAccount);
                showToast('Wallet successfully connected!', 'success');
            } else {
                setConnectionUI(false);
            }
        } catch (error) {
            console.error('Connection error:', error);
            // User rejected prompt
            if (error.code === 4001) {
                showToast('Connection request rejected by user.', 'warning');
            } else {
                showToast(error.message || 'An error occurred during connection', 'error');
            }
            setConnectionUI(false);
        } finally {
            isConnecting = false;
        }
    }
    // Disconnect Wallet Handler (Simulated Client-Side)
    function disconnectWallet() {
        currentAccount = null;
        localStorage.removeItem('wallet_connected');
        setConnectionUI(false);
        showToast('Wallet disconnected.', 'info');
    }
    // Copy Address Handler
    copyAddressBtn.addEventListener('click', () => {
        if (!currentAccount) return;
        navigator.clipboard.writeText(currentAccount)
            .then(() => {
                showToast('Wallet address copied to clipboard!', 'success');
            })
            .catch(err => {
                console.error('Could not copy text: ', err);
                showToast('Failed to copy address', 'error');
            });
    });
    // Listeners
    btnConnect.addEventListener('click', connectWallet);
    heroConnectBtn.addEventListener('click', connectWallet);
    btnDisconnect.addEventListener('click', disconnectWallet);
    // EIP-1193 MetaMask Event Listeners
    if (checkMetaMaskInstalled()) {
        // Accounts Changed listener
        window.ethereum.on('accountsChanged', async (accounts) => {
            if (accounts.length === 0) {
                // User disconnected from Metamask UI
                disconnectWallet();
            } else if (accounts[0] !== currentAccount) {
                currentAccount = accounts[0];
                showToast('Wallet account switched.', 'info');
                await updateWalletDetails(currentAccount);
            }
        });
        // Chain Changed listener
        window.ethereum.on('chainChanged', (chainId) => {
            showToast('Network changed. Reloading page...', 'info');
            // standard recommendation is to reload the window as data might have changed
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });
    }
    // Check if wallet was connected in previous session
    async function checkPersistedConnection() {
        if (localStorage.getItem('wallet_connected') === 'true' && checkMetaMaskInstalled()) {
            try {
                // Check if already authorized
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    currentAccount = accounts[0];
                    await updateWalletDetails(currentAccount);
                } else {
                    // Not authorized anymore
                    localStorage.removeItem('wallet_connected');
                }
            } catch (err) {
                console.error('Error during auto-connection check:', err);
            }
        }
    }
    checkPersistedConnection();
});
