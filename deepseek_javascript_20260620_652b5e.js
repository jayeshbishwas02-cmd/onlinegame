const gps = new PhoneGPS();

try {
    const position = await gps.getLocation({
        enableHighAccuracy: true,
        retryAttempts: 3,
        retryDelay: 2000
    });
    // Use location
} catch (error) {
    // Handle error
}