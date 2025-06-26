const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  let ipAddress = '';

  // Iterate through network interfaces
  Object.keys(interfaces).forEach((interfaceName) => {
    const networkInterface = interfaces[interfaceName];
    
    // Skip over non-IPv4 and internal (loopback) interfaces
    const externalInterface = networkInterface.find(
      (iface) => iface.family === 'IPv4' && !iface.internal
    );
    
    if (externalInterface) {
      ipAddress = externalInterface.address;
    }
  });

  return ipAddress;
}

const ip = getLocalIP();
console.log('Server IP Address:', ip);
console.log('Use this IP in your mobile app API_URL configuration');
console.log(`Example: const API_URL = 'http://${ip}:3000';`); 