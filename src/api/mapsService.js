export const fetchNearbyVets = async (lat, lng) => {
  const key = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "demo-maps-key";
  
  // Don't make API call if using demo key
  if (!key || key === "demo-maps-key") {
    throw new Error('Google Maps API key not configured');
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=3000&type=veterinary_care&key=${key}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`Maps API error: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    
    // Check for API errors in response
    if (data.status === 'REQUEST_DENIED' || data.status === 'INVALID_REQUEST') {
      throw new Error(`Maps API error: ${data.error_message || data.status}`);
    }
    
    return data;
  } catch (err) {
    console.error('Error fetching nearby vets:', err);
    throw err;
  }
};
