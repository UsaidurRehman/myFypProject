// OPTION 1: Published IIS Backend (Physical Device, no port needed):
// export const SERVER_BASE = 'http://192.168.100.13/Fyp_Backend';
export const SERVER_BASE = 'http://192.168.100.13/Fyp_Backend';

// OPTION 2: Visual Studio Dev — Physical Device (same Wi-Fi):
// const IP_ADDRESS = '192.168.100.13';
// const IP_ADDRESS = '192.168.43.144';
// const PORT = '5150';
// export const SERVER_BASE = `http://${IP_ADDRESS}:${PORT}`;

// OPTION 3: Visual Studio Dev — Android Emulator:
// const IP_ADDRESS = '10.0.2.2';
// const PORT = '5139';
// export const SERVER_BASE = `http://${IP_ADDRESS}:${PORT}`;

export const API_DASHBOARD = `${SERVER_BASE}/api/Dashboard`;
export const API_AUTH = `${SERVER_BASE}/api/Auth`;
export const API_ACCOUNT = `${SERVER_BASE}/api/AccountCreation`;
