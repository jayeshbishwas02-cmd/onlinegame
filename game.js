// ===== COMPLETE PHONE GPS LOCATION SOLUTION =====

class PhoneGPS {
    constructor() {
        this.location = null;
        this.watchId = null;
        this.isWatching = false;
        this.callbacks = {
            onSuccess: null,
            onError: null,
            onUpdate: null
        };
        this.attempts = 0;
        this.maxAttempts = 5;
    }

    // ===== MAIN METHOD: Get Location Once =====
    getLocation(options = {}) {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject({
                    code: 'NOT_SUPPORTED',
                    message: 'Geolocation is not supported on this device'
                });
                return;
            }

            const defaultOptions = {
                enableHighAccuracy: true,     // Use GPS
                timeout: 15000,               // 15 seconds
                maximumAge: 0,                // Fresh location only
                retryAttempts: 3,
                retryDelay: 2000
            };

            const config = { ...defaultOptions, ...options };
            this.attempts = 0;
            this.tryGetLocation(resolve, reject, config);
        });
    }

    // ===== RETRY LOGIC =====
    tryGetLocation(resolve, reject, config) {
        this.attempts++;
        console.log(`📍 GPS Attempt ${this.attempts}/${config.retryAttempts + 1}`);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                // SUCCESS
                this.location = position;
                this.updateLocation(position);
                resolve(position);
            },
            (error) => {
                // ERROR - Try again if possible
                console.warn(`GPS Error ${this.attempts}:`, error.message);

                if (this.attempts <= config.retryAttempts) {
                    // Retry with different settings
                    const newConfig = { ...config };
                    
                    if (this.attempts === 2) {
                        newConfig.timeout = 20000;
                    } else if (this.attempts === 3) {
                        newConfig.timeout = 30000;
                    } else if (this.attempts >= 4) {
                        newConfig.enableHighAccuracy = false; // Fallback to WiFi/Cell
                    }

                    setTimeout(() => {
                        this.tryGetLocation(resolve, reject, newConfig);
                    }, config.retryDelay);
                } else {
                    // All attempts failed
                    reject({
                        code: error.code,
                        message: this.getErrorMessage(error)
                    });
                }
            },
            config
        );
    }

    // ===== CONTINUOUS LOCATION TRACKING =====
    watchLocation(options = {}) {
        if (!navigator.geolocation) {
            throw new Error('Geolocation not supported');
        }

        if (this.isWatching) {
            this.stopWatching();
        }

        const defaultOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        const config = { ...defaultOptions, ...options };

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.location = position;
                this.updateLocation(position);
                
                if (this.callbacks.onUpdate) {
                    this.callbacks.onUpdate(position);
                }
            },
            (error) => {
                console.warn('Watch location error:', error.message);
                if (this.callbacks.onError) {
                    this.callbacks.onError(error);
                }
            },
            config
        );

        this.isWatching = true;
        return this.watchId;
    }

    stopWatching() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
            this.isWatching = false;
            console.log('📍 Stopped watching location');
        }
    }

    // ===== UPDATE LOCATION DATA =====
    updateLocation(position) {
        this.location = {
            coords: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude || null,
                altitudeAccuracy: position.coords.altitudeAccuracy || null,
                heading: position.coords.heading || null,
                speed: position.coords.speed || null
            },
            timestamp: position.timestamp,
            readableTime: new Date(position.timestamp).toLocaleString(),
            mapUrl: `https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`
        };
    }

    // ===== GET LOCATION DATA =====
    getCurrentLocation() {
        return this.location;
    }

    getCoordinates() {
        if (!this.location) return null;
        return {
            lat: this.location.coords.latitude,
            lon: this.location.coords.longitude
        };
    }

    getAccuracy() {
        if (!this.location) return null;
        return Math.round(this.location.coords.accuracy);
    }

    // ===== SET CALLBACKS =====
    onSuccess(callback) {
        this.callbacks.onSuccess = callback;
        return this;
    }

    onError(callback) {
        this.callbacks.onError = callback;
        return this;
    }

    onUpdate(callback) {
        this.callbacks.onUpdate = callback;
        return this;
    }

    // ===== HELPER METHODS =====
    getErrorMessage(error) {
        const messages = {
            1: 'Permission denied. Please allow location access in browser settings.',
            2: 'Location unavailable. Please enable GPS or Wi-Fi.',
            3: 'Location request timed out. Please try again.',
            4: 'Unknown error occurred.'
        };
        return messages[error.code] || messages[4];
    }

    isLocationSupported() {
        return !!navigator.geolocation;
    }

    // ===== Check if GPS is enabled (Android) =====
    checkGPSSettings() {
        // Note: This is a hack - browser can't directly check GPS settings
        // But we can try to detect if location is available
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(false);
                return;
            }

            // Quick check with short timeout
            navigator.geolocation.getCurrentPosition(
                () => resolve(true),
                (error) => {
                    // If error is timeout or unavailable, GPS might be off
                    if (error.code === 2 || error.code === 3) {
                        resolve(false);
                    } else {
                        resolve(false);
                    }
                },
                { timeout: 3000, enableHighAccuracy: true }
            );
        });
    }
}

// ===== USAGE EXAMPLES =====

// 1. SINGLE LOCATION REQUEST
const gps = new PhoneGPS();

// Get location once
gps.getLocation()
    .then(position => {
        console.log('📍 Location found:', position.coords);
        console.log('📏 Accuracy:', position.coords.accuracy, 'meters');
        
        // Update UI
        document.getElementById('lat').textContent = position.coords.latitude.toFixed(6);
        document.getElementById('lon').textContent = position.coords.longitude.toFixed(6);
        document.getElementById('accuracy').textContent = Math.round(position.coords.accuracy);
    })
    .catch(error => {
        console.error('❌ Location error:', error.message);
        // Show error to user
        document.getElementById('status').textContent = '❌ ' + error.message;
    });

// 2. CONTINUOUS LOCATION TRACKING (Good for games)
const tracker = new PhoneGPS();

// Setup callbacks
tracker.onUpdate((position) => {
    console.log('📍 Location updated:', position.coords);
    // Update game with new location
    updateGameLocation(position);
})
.onError((error) => {
    console.warn('Tracking error:', error.message);
});

// Start tracking
tracker.watchLocation({
    enableHighAccuracy: true,
    timeout: 10000
});

// Stop tracking when done
// tracker.stopWatching();

// 3. WITH RETRY LOGIC (Recommended)
const gpsRetry = new PhoneGPS();

async function getLocationWithRetry() {
    try {
        const position = await gpsRetry.getLocation({
            enableHighAccuracy: true,
            retryAttempts: 3,
            retryDelay: 2000
        });
        console.log('✅ GPS Success!', position.coords);
        return position;
    } catch (error) {
        console.error('❌ GPS Failed:', error.message);
        throw error;
    }
}

// 4. CHECK GPS STATUS
async function checkGPS() {
    const gps = new PhoneGPS();
    const isSupported = gps.isLocationSupported();
    
    if (!isSupported) {
        console.log('❌ GPS not supported');
        return false;
    }

    try {
        // Quick check to see if GPS works
        const position = await gps.getLocation({ timeout: 5000 });
        console.log('✅ GPS is working!');
        return true;
    } catch (error) {
        console.log('❌ GPS not available:', error.message);
        return false;
    }
}

// ===== HTML TEMPLATE FOR PHONE =====

/* 
Add this HTML to your page:

<div id="gpsStatus">
    <h3>📍 GPS Status</h3>
    <div>
        <span id="gpsDot" style="display:inline-block; width:12px; height:12px; border-radius:50%;"></span>
        <span id="gpsText">Waiting for location...</span>
    </div>
    <div style="font-size:0.9em; margin-top:10px;">
        <div>Latitude: <span id="lat">--</span></div>
        <div>Longitude: <span id="lon">--</span></div>
        <div>Accuracy: <span id="accuracy">--</span> meters</div>
    </div>
</div>

<style>
    #gpsDot.active {
        background: #2ecc71;
        animation: pulse 1s infinite;
    }
    #gpsDot.searching {
        background: #f1c40f;
        animation: pulse 0.5s infinite;
    }
    #gpsDot.inactive {
        background: #e74c3c;
    }
    @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.8); }
    }
</style>

<script>
// Update the UI with GPS data
function updateGPSUI(position) {
    document.getElementById('lat').textContent = position.coords.latitude.toFixed(6);
    document.getElementById('lon').textContent = position.coords.longitude.toFixed(6);
    document.getElementById('accuracy').textContent = Math.round(position.coords.accuracy);
    document.getElementById('gpsDot').className = 'active';
    document.getElementById('gpsText').textContent = '✅ GPS Active';
}

function showGPSError(error) {
    document.getElementById('gpsDot').className = 'inactive';
    document.getElementById('gpsText').textContent = '❌ ' + error.message;
}
</script>
*/

// ===== PHONE-SPECIFIC DETECTION =====
function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isAndroid() {
    return /Android/i.test(navigator.userAgent);
}

function isIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// ===== PHONE GPS SETTINGS GUIDE =====
function showPhoneGPSSettings() {
    if (isAndroid()) {
        console.log(`
        📱 Android GPS Settings:
        1. Settings → Location → Turn ON
        2. Settings → Apps → [Browser] → Permissions → Location → Allow
        3. Location Mode → High accuracy
        `);
    } else if (isIOS()) {
        console.log(`
        📱 iPhone GPS Settings:
        1. Settings → Privacy → Location Services → ON
        2. Settings → Safari → Location → Ask or Allow
        3. Check that you're not in Airplane Mode
        `);
    } else {
        console.log(`
        💻 PC GPS Settings:
        1. Make sure Wi-Fi is enabled
        2. Allow location in browser settings
        3. Some PCs don't have GPS hardware
        `);
    }
}

// ===== EXPORT FOR MODULE USE =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhoneGPS;
} else {
    // Make available globally
    window.PhoneGPS = PhoneGPS;
}

console.log('📱 Phone GPS module loaded!');
console.log(`📱 Device: ${isMobileDevice() ? 'Mobile' : 'Desktop'}`);
console.log(`📱 OS: ${isAndroid() ? 'Android' : isIOS() ? 'iOS' : 'Other'}`);
