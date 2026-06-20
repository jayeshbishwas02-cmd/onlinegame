const gps = new PhoneGPS();

gps.getLocation()
    .then(position => {
        console.log('📍 Found:', position.coords.latitude, position.coords.longitude);
    })
    .catch(error => {
        console.error('❌ Error:', error.message);
    });