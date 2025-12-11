let bluetoothDevice;
let customCharacteristic;
const SERVICE_UUID = 'YOUR_SERVICE_UUID'; 
const CHARACTERISTIC_UUID = 'YOUR_CHARACTERISTIC_UUID'; 

// Elements for output
const statusElement = document.getElementById('status');
const receivedDataElement = document.getElementById('receivedData');

document.getElementById('connectButton').addEventListener('click', connectDevice);
// We need buttons for reading static data and subscribing to notifications
document.getElementById('readButton').addEventListener('click', readValue);
document.getElementById('subscribeButton').addEventListener('click', toggleNotifications);


async function connectDevice() {
    statusElement.textContent = 'Connecting...';
    try {
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            filters: [{ services: [SERVICE_UUID] }],
            // You must list the service here again
            optionalServices: [SERVICE_UUID] 
        });
        
        const server = await bluetoothDevice.gatt.connect();
        const service = await server.getPrimaryService(SERVICE_UUID);
        customCharacteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
        
        statusElement.textContent = 'Connected and ready to receive data.';
        // Enable buttons
        document.getElementById('readButton').disabled = false;
        document.getElementById('subscribeButton').disabled = false;

        // Add a listener for when the device disconnects unexpectedly
        bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);

    } catch (error) {
        statusElement.textContent = `Error: ${error.message}`;
        console.error(error);
    }
}

function onDisconnected(event) {
  const device = event.target;
  console.log(`Device ${device.name} is disconnected.`);
  statusElement.textContent = 'Disconnected. Please refresh to connect again.';
  document.getElementById('readButton').disabled = true;
  document.getElementById('subscribeButton').disabled = true;
}


// --- Receiving Data Option 1: Read a static value once ---
async function readValue() {
    if (!customCharacteristic) return;

    try {
        statusElement.textContent = 'Reading value...';
        const value = await customCharacteristic.readValue();
        
        // Use TextDecoder to convert the received ArrayBuffer back to a string
        const decoder = new TextDecoder('utf-8');
        const receivedText = decoder.decode(value);

        receivedDataElement.textContent = `Read Once: ${receivedText}`;
        statusElement.textContent = 'Read complete.';
        console.log('Received:', receivedText);

    } catch (error) {
        console.error(`Failed to read value: ${error}`);
        statusElement.textContent = 'Read failed.';
    }
}


// --- Receiving Data Option 2: Subscribe to notifications/indications ---

let isSubscribed = false;

async function toggleNotifications() {
    if (!customCharacteristic) return;

    try {
        if (isSubscribed) {
            // Stop notifications
            await customCharacteristic.stopNotifications();
            customCharacteristic.removeEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
            document.getElementById('subscribeButton').textContent = 'Start Notifications';
            statusElement.textContent = 'Notifications stopped.';
            isSubscribed = false;
        } else {
            // Start notifications
            await customCharacteristic.startNotifications();
            customCharacteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
            document.getElementById('subscribeButton').textContent = 'Stop Notifications';
            statusElement.textContent = 'Notifications started. Waiting for data...';
            isSubscribed = true;
        }
    } catch (error) {
        console.error(`Toggle notifications failed: ${error}`);
        statusElement.textContent = 'Notification error.';
    }
}

// Event handler function for incoming data stream
function handleCharacteristicValueChanged(event) {
    const value = event.target.value; // DataView
    const decoder = new TextDecoder('utf-8');
    const receivedText = decoder.decode(value);

    // Append the new data to the display area
    receivedDataElement.textContent = `Notified: ${receivedText} (Last update: ${new Date().toLocaleTimeString()})`;
    console.log('Notification received:', receivedText);
}
