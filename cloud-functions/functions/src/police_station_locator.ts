import {calculate_distance_km} from './geo_utils';

export const POLICE_STATION_MI_NAMECODE = "MI";
export const POLICE_STATION_KE_NAMECODE = "KE";
export const POLICE_STATION_NOT_AVAILABLE_NAMECODE = "N/A";

// location of police station Michalovce, with radius in km
const POLICE_STATION_MI = {
    name: "POLICE_STATION_MI",
    nameCode: POLICE_STATION_MI_NAMECODE,
    lat: 48.75434,
    lng: 21.9195,
    rad: 4
};

const POLICE_STATION_KE = {
    name: "POLICE_STATION_KE",
    nameCode: POLICE_STATION_KE_NAMECODE,
    lat: 48.71395,
    lng: 21.25808,
    rad: 6
}

const SUPPORTED_STATIONS = [POLICE_STATION_MI, POLICE_STATION_KE]; 

export function getClosestPoliceStation(lat: number, lng: number): string {
    var returnValue = POLICE_STATION_NOT_AVAILABLE_NAMECODE;
    SUPPORTED_STATIONS.forEach(station => {
        const distance = calculate_distance_km(station.lat, station.lng, lat, lng);
        if(distance <= station.rad) {
            returnValue = station.nameCode;
        }
    });
    return returnValue;
}