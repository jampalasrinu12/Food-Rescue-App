/**
 * HAVERSINE FORMULA - Calculate distance between two coordinates
 * Returns distance in kilometers
 */
exports.haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km

  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 1000) / 1000; // Round to 3 decimal places (meters precision)
};

/**
 * Check if pickup is close enough to donor (within 50 meters)
 */
exports.isPickupArrivedAtDonor = (pickupLat, pickupLng, donorLat, donorLng) => {
  const distKm = exports.haversineDistance(pickupLat, pickupLng, donorLat, donorLng);
  const distMeters = distKm * 1000;
  return distMeters <= 50; // Within 50 meters
};

/**
 * Get bearing angle between two coordinates (for navigation)
 */
exports.getBearing = (lat1, lon1, lat2, lon2) => {
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180));
  const x =
    Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
    Math.sin(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.cos(dLon * (Math.PI / 180));

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360; // Normalize to 0-360
};
