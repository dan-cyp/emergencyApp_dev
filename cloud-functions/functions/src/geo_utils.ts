const EARTH_RADIUS = 6371;  //Radius of the Earth in kilometers
  

// sphericalLawOfCosinesDistance
export function calculate_distance_km(lat1: number, lng1: number, lat2: number, lng2: number): number {
    // Convert degrees to radians
    const lat1Rad = toRadians(lat1);
    const lon1Rad = toRadians(lng1);
    const lat2Rad = toRadians(lat2);
    const lon2Rad = toRadians(lng2);
  
    // Calculate the angular difference in radians
    const angularDifference = Math.acos(
      Math.sin(lat1Rad) * Math.sin(lat2Rad) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lon2Rad - lon1Rad)
    );
  
    // Calculate the distance using the angular difference and Earth's radius
    const distance = EARTH_RADIUS * angularDifference;
  
    return distance;
}

function toRadians(degrees: number):number {
    return degrees * (Math.PI / 180);
}