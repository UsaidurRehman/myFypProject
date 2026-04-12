// =============================================================
//  CENTRAL API CONFIGURATION
// =============================================================
//  HOW TO SWITCH BETWEEN EMULATOR AND PHYSICAL DEVICE:
//
//  1. ANDROID EMULATOR (default):
//     Set IP_ADDRESS = '10.0.2.2'
//
//  2. PHYSICAL DEVICE (phone on same Wi-Fi as your PC):
//     - Run `ipconfig` in your PC's Command Prompt
//     - Copy your IPv4 Address (e.g. 192.168.1.15)
//     - Set IP_ADDRESS = '192.168.1.15'  <-- your actual IP here
//
// =============================================================

const IP_ADDRESS = '10.0.2.2';
// const IP_ADDRESS = '192.168.100.13';
const PORT = '5139';
export const SERVER_BASE = `http://${IP_ADDRESS}:${PORT}`;
export const API_DASHBOARD = `${SERVER_BASE}/api/Dashboard`;
export const API_AUTH = `${SERVER_BASE}/api/Auth`;
export const API_ACCOUNT = `${SERVER_BASE}/api/AccountCreation`;
