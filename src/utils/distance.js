/**
 * HAVERSINE FORMULA - Calculate distance between two coordinates
 * Returns distance in kilometers
 */
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
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

  return Math.round(distance * 1000) / 1000; // Round to 3 decimal places
};

/**
 * Format distance for display
 */
export const formatDistance = (distanceKm) => {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters}m`;
  }
  return `${distanceKm.toFixed(2)}km`;
};

/**
 * Get distance status with emoji
 */
export const getDistanceStatus = (distanceKm) => {
  const meters = distanceKm * 1000;

  if (meters <= 50) {
    return { status: "arrived", emoji: "✅", label: "Arrived!" };
  } else if (meters <= 500) {
    return { status: "very_close", emoji: "🟢", label: "Very Close" };
  } else if (meters <= 1000) {
    return { status: "close", emoji: "🟡", label: "Close" };
  } else {
    return { status: "far", emoji: "🔴", label: "Far" };
  }
};

/**
 * Get bearing angle between two coordinates (direction)
 */
export const getBearing = (lat1, lon1, lat2, lon2) => {
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180));
  const x =
    Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
    Math.sin(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.cos(dLon * (Math.PI / 180));

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
};

/**
 * Get compass direction from bearing angle
 */
export const getCompassDirection = (bearing) => {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round((bearing % 360) / (360 / 16));
  return directions[index % 16];
};
