export const fetchNearbyVets = async (lat, lng) => {
  const key = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "demo-maps-key";
  const res = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=3000&type=veterinary_care&key=${key}`);
  if(!res.ok) throw new Error('Maps API error');
  return res.json();
};
