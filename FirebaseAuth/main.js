const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');
const WebSocket = require('ws');

// Keep a global reference of the window object
let mainWindow;
let authWindow;

// Persistent authentication and connection state
let authState = {
    isAuthenticated: false,
    token: null,
    userId: null,
    username: null,
    email: null,
    userData: null
};

// Main process API and WebSocket state
let mainProcessWebSocket = null;
let axiosInstance = null;

// Connection monitoring
let connectionMonitorInterval = null;

/**
 * Initialize main process API and WebSocket clients
 */
function initializeMainProcessClients() {
    console.log('Initializing main process clients...');

    // Initialize axios instance for API calls
    axiosInstance = axios.create({
        baseURL: 'http://127.0.0.1:3000',
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json'
        }
    });

    // Add request interceptor to include auth token
    axiosInstance.interceptors.request.use(
        (config) => {
            if (authState.token) {
                config.headers.Authorization = `Bearer ${authState.token}`;
                console.log('🔐 Main process: Adding auth token to request:', config.url);
            } else {
                console.warn('⚠️ Main process: No auth token available for request:', config.url);
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Setup WebSocket event handlers
    setupMainProcessWebSocketHandlers();
}

/**
 * Setup WebSocket event handlers for main process
 */
function setupMainProcessWebSocketHandlers() {
    // WebSocket setup will be done when needed
    console.log('WebSocket handlers setup ready');
}

/**
 * Connect WebSocket for authenticated user
 */
function connectWebSocket(userId) {
    if (mainProcessWebSocket) {
        mainProcessWebSocket.close();
    }

    const wsUrl = `ws://127.0.0.1:3000/ws?userID=${userId}&clientType=desktop`;
    console.log('Connecting WebSocket to:', wsUrl);

    mainProcessWebSocket = new WebSocket(wsUrl);

    mainProcessWebSocket.on('open', () => {
        console.log('Main process WebSocket connected');
        broadcastToAllWindows('websocket-status', { connected: true });
    });

    mainProcessWebSocket.on('close', () => {
        console.log('Main process WebSocket disconnected');
        broadcastToAllWindows('websocket-status', { connected: false });
    });

    mainProcessWebSocket.on('error', (error) => {
        console.error('Main process WebSocket error:', error);
        broadcastToAllWindows('websocket-error', { error: error.message });
    });

    mainProcessWebSocket.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            broadcastToAllWindows('websocket-message', message);
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    });
}

/**
 * Authenticate user and establish persistent connection
 */
async function authenticateUser(email, password) {
    try {
        console.log('Main process: Authenticating user...');

        if (!axiosInstance) {
            throw new Error('API client not initialized');
        }

        // Authenticate with backend
        const response = await axiosInstance.post('/api/auth/login', {
            email,
            password
        });

        if (!response.data.success) {
            throw new Error(response.data.message || 'Login failed');
        }

        // Extract authentication data
        const authToken = response.data.token || response.data.customToken;
        const userInfo = response.data.user;

        // Update auth state
        authState = {
            isAuthenticated: true,
            token: authToken,
            userId: userInfo.userID,
            username: userInfo.username,
            email: userInfo.email,
            userData: {
                userId: userInfo.userID,
                username: userInfo.username,
                email: userInfo.email,
                ownedCommunities: userInfo.ownedCommunities || [],
                memberCommunities: userInfo.memberCommunities || []
            }
        };

        // Update axios instance with auth token
        if (axiosInstance) {
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        }

        // Connect WebSocket with user ID
        connectWebSocket(userInfo.userID);

        // Start connection monitoring
        startConnectionMonitoring();

        // Send updated user data to renderer after successful authentication
        if (mainWindow && mainWindow.webContents) {
            console.log('🔥 MAIN: Sending user data to renderer...');
            console.log('🔥 MAIN: authState:', authState);

            const userDataToSend = {
                username: authState.username || 'Unknown',
                userId: authState.userId,
                email: authState.email,
                isAuthenticated: authState.isAuthenticated,
                token: authState.token,
                serviceInitialized: authState.isAuthenticated,
                ownedCommunities: authState.userData?.ownedCommunities || [],
                memberCommunities: authState.userData?.memberCommunities || []
            };

            console.log('🔥 MAIN: Sending data:', userDataToSend);
            mainWindow.webContents.send('user-data', userDataToSend);
            console.log('🔥 MAIN: User data sent successfully!');
        }

        console.log('Main process: Authentication successful for user:', userInfo.username);

        // Trigger community data preloading in the main window
        if (mainWindow && mainWindow.webContents) {
            console.log('🔄 Triggering community data preload...');
            mainWindow.webContents.send('trigger-preload');
        }

        return { success: true, authState };

    } catch (error) {
        console.error('Main process: Authentication failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Logout user and cleanup connections
 */
function logoutUser() {
    console.log('Main process: Logging out user...');

    // Stop connection monitoring
    stopConnectionMonitoring();

    // Disconnect WebSocket
    if (mainProcessWebSocket) {
        mainProcessWebSocket.close();
    }

    // Clear API authentication
    if (axiosInstance) {
        delete axiosInstance.defaults.headers.common['Authorization'];
    }

    // Reset auth state
    authState = {
        isAuthenticated: false,
        token: null,
        userId: null,
        username: null,
        email: null,
        userData: null
    };

    console.log('Main process: User logged out successfully');
}

/**
 * Start connection monitoring
 */
function startConnectionMonitoring() {
    if (connectionMonitorInterval) {
        clearInterval(connectionMonitorInterval);
    }

    connectionMonitorInterval = setInterval(() => {
        if (authState.isAuthenticated) {
            // Check if WebSocket is connected
            if (!mainProcessWebSocket || mainProcessWebSocket.readyState !== WebSocket.OPEN) {
                console.log('Connection monitor: WebSocket disconnected, attempting reconnect...');
                if (authState.userId) {
                    connectWebSocket(authState.userId);
                }
            }

            // Send periodic health check to keep connection alive
            if (axiosInstance) {
                axiosInstance.get('/api/desktop/health')
                    .catch(error => {
                        console.log('Connection monitor: Health check failed:', error.message);
                    });
            }
        }
    }, 30000); // Check every 30 seconds

    console.log('Connection monitoring started');
}

/**
 * Stop connection monitoring
 */
function stopConnectionMonitoring() {
    if (connectionMonitorInterval) {
        clearInterval(connectionMonitorInterval);
        connectionMonitorInterval = null;
        console.log('Connection monitoring stopped');
    }
}

/**
 * Broadcast message to all open windows
 */
function broadcastToAllWindows(channel, data) {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
        if (window && !window.isDestroyed()) {
            window.webContents.send(channel, data);
        }
    });
}

function createAuthWindow() {
    // Create the authentication window
    authWindow = new BrowserWindow({
        width: 450,
        height: 450,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            webSecurity: false // Allow HTTP requests to localhost for development
        },
        icon: path.join(__dirname, '../assets/icon.png'), // Optional icon
        show: false // Don't show until ready
    });

    // Load the authentication page
    authWindow.loadFile(path.join(__dirname, 'auth.html'));

    // Show window when ready
    authWindow.once('ready-to-show', () => {
        authWindow.show();
    });

    // Handle window closed
    authWindow.on('closed', () => {
        authWindow = null;
        // If auth window is closed, quit the app
        if (!mainWindow) {
            app.quit();
        }
    });

    return authWindow;
}

function createMainWindow(username, userId) {
    // Create the main application window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        titleBarStyle: 'hiddenInset', // Hide title bar but keep window controls
        title: '', // Remove title text
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            webSecurity: false // Allow HTTP requests to localhost for development
        },
        icon: path.join(__dirname, '../assets/icon.png'), // Optional icon
        show: false // Don't show until ready
    });

    // Load the main page
    mainWindow.loadFile(path.join(__dirname, 'main.html'));

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.maximize(); // Start maximized
        
        // Send complete auth state to the renderer process
        console.log('🔥 MAIN (ready-to-show): Sending user data to renderer...');
        console.log('🔥 MAIN (ready-to-show): authState:', authState);

        const userDataToSend = {
            username: authState?.username || 'Unknown',
            userId: authState?.userId,
            email: authState?.email,
            isAuthenticated: authState?.isAuthenticated || false,
            token: authState?.token,
            serviceInitialized: authState?.isAuthenticated || false,
            ownedCommunities: authState?.userData?.ownedCommunities || [],
            memberCommunities: authState?.userData?.memberCommunities || []
        };

        console.log('🔥 MAIN (ready-to-show): Sending data:', userDataToSend);
        mainWindow.webContents.send('user-data', userDataToSend);
        console.log('🔥 MAIN (ready-to-show): User data sent successfully!');
    });

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Add keyboard shortcuts
    mainWindow.webContents.on('before-input-event', (event, input) => {
        // F5 to reload
        if (input.key === 'F5') {
            console.log('F5 pressed - reloading window');
            mainWindow.webContents.reload();
        }
        // Ctrl+R to reload
        if (input.control && input.key === 'r') {
            console.log('Ctrl+R pressed - reloading window');
            mainWindow.webContents.reload();
        }
        // F12 to open dev tools
        if (input.key === 'F12') {
            console.log('F12 pressed - toggling dev tools');
            mainWindow.webContents.toggleDevTools();
        }
    });

    return mainWindow;
}

// Handle authentication request from auth window
ipcMain.handle('authenticate-user', async (event, { email, password }) => {
    console.log('Main process: Received authentication request for:', email);

    const result = await authenticateUser(email, password);

    if (result.success) {
        // Close auth window
        if (authWindow) {
            authWindow.close();
            authWindow = null;
        }

        // Create main window with authenticated user
        createMainWindow(result.authState.username, result.authState.userId);
    }

    return result;
});

// Handle get user data request from renderer
ipcMain.handle('get-user-data', async (event) => {
    console.log('🔥 MAIN: get-user-data requested, authState:', authState);

    if (!authState || !authState.isAuthenticated) {
        console.log('🔥 MAIN: No authenticated user data available');
        return null;
    }

    const userDataToSend = {
        username: authState.username || 'Unknown',
        userId: authState.userId,
        email: authState.email,
        isAuthenticated: authState.isAuthenticated,
        token: authState.token,
        serviceInitialized: authState.isAuthenticated,
        ownedCommunities: authState.userData?.ownedCommunities || [],
        memberCommunities: authState.userData?.memberCommunities || []
    };

    console.log('🔥 MAIN: Returning user data:', userDataToSend);
    return userDataToSend;
});

// Handle legacy auth-success for backward compatibility (if needed)
ipcMain.on('auth-success', (event, userData) => {
    console.log('Legacy auth-success received:', userData);
    // This should no longer be used, but keeping for safety
});

// Handle logout
ipcMain.on('logout', (event) => {
    console.log('Main process: Logout requested');

    // Logout user and cleanup connections
    logoutUser();

    // Close main window
    if (mainWindow) {
        mainWindow.close();
        mainWindow = null;
    }

    // Show auth window again
    createAuthWindow();
});

// Add IPC handlers for API calls from renderer processes
ipcMain.handle('api-call', async (event, { method, endpoint, data }) => {
    if (!axiosInstance) {
        return { success: false, error: 'API client not initialized' };
    }

    console.log(`🔗 Main process API call: ${method} ${endpoint}`, {
        hasToken: !!authState.token,
        tokenLength: authState.token ? authState.token.length : 0,
        headers: axiosInstance.defaults.headers.common
    });

    try {
        let result;
        switch (method.toLowerCase()) {
            case 'get':
                result = await axiosInstance.get(endpoint);
                break;
            case 'post':
                result = await axiosInstance.post(endpoint, data);
                break;
            case 'put':
                result = await axiosInstance.put(endpoint, data);
                break;
            case 'delete':
                result = await axiosInstance.delete(endpoint);
                break;
            default:
                throw new Error(`Unsupported HTTP method: ${method}`);
        }

        return { success: true, data: result.data };
    } catch (error) {
        console.error('Main process API call failed:', {
            endpoint,
            method,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            status: error.response?.status
        };
    }
});

// Handle WebSocket message sending from renderer processes
ipcMain.handle('websocket-send', async (event, message) => {
    if (!mainProcessWebSocket || mainProcessWebSocket.readyState !== WebSocket.OPEN) {
        return { success: false, error: 'WebSocket not connected' };
    }

    try {
        mainProcessWebSocket.send(JSON.stringify(message));
        return { success: true };
    } catch (error) {
        console.error('Main process WebSocket send failed:', error);
        return { success: false, error: error.message };
    }
});

// Get current auth state
ipcMain.handle('get-auth-state', async (event) => {
    return authState;
});

// Handle app ready
app.whenReady().then(() => {
    console.log('Homara App starting...');

    // Initialize main process clients
    initializeMainProcessClients();

    // Create auth window
    createAuthWindow();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
    // Cleanup connections before quitting
    logoutUser();

    // On macOS, keep app running even when all windows are closed
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle app quit
app.on('before-quit', () => {
    console.log('App quitting, cleaning up connections...');
    logoutUser();
});

// Handle app activation (macOS)
app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
        createAuthWindow();
    }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        console.log('Blocked new window creation to:', navigationUrl);
    });
});

console.log('Electron main process initialized');
