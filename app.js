// This function handles the entire asynchronous connection and read process
async function connectAndReadBattery() {
    const statusElement = document.getElementById('status');
    const batteryElement = document.getElementById('batteryLevel');

    statusElement.textContent = 'Connecting...';
    
    try {
        // Step 1: Request a device (filtering for standard Battery Service UUID)
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ services: ['battery_service'] }]
        });
        
        statusElement.textContent = `Found device: ${device.name}. Connecting to GATT server...`;

        // Step 2: Connect to the GATT Server
        const server = await device.gatt.connect();
        
        statusElement.textContent = 'Connected. Getting service...';

        // Step 3: Get the Primary Service
        const service = await server.getPrimaryService('battery_service');
        
        statusElement.textContent = 'Service found. Getting characteristic...';

        // Step 4: Get the Characteristic (Battery Level UUID)
        const characteristic = await service.getCharacteristic('battery_level');
        
        statusElement.textContent = 'Characteristic found. Reading value...';

        // Step 5: Read the Value
        const value = await characteristic.readValue();
        
        // DataView methods like getUint8() extract the actual value from the DataView
        const batteryLevel = value.getUint8(0); 

        statusElement.textContent = 'Success!';
        batteryElement.textContent = `${batteryLevel}%`;

        // Optional: Disconnect on completion or set up event listeners for notifications
        device.gatt.disconnect();
        console.log('Disconnected from device.');

    } catch (error) {
        statusElement.textContent = `Error: ${error.message}`;
        console.error(error);
    }
}

// Attach the function to the button click event
document.getElementById('connectButton').addEventListener('click', connectAndReadBattery);
