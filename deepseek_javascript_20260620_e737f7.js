const tracker = new PhoneGPS();

tracker.onUpdate((position) => {
    // Update game with new location
    console.log('📍 New location:', position.coords);
});

tracker.watchLocation();