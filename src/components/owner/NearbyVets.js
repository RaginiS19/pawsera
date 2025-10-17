import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../api/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { fetchNearbyVets } from '../../api/mapsService';
import { logoutUser } from '../../api/authService';
import BottomNavigation from '../common/BottomNavigation';

export default function NearbyVets() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [coords, setCoords] = useState(null); // {lat, lng}
  const [places, setPlaces] = useState([]);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const user = auth?.currentUser || null;

  useEffect(() => {
    async function init() {
      if (!user) {
        navigate('/');
        return;
      }
      setLoading(true);
      setError(null);

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const fallbackCity = userData.city || 'Toronto';

        const position = await getCurrentPositionSafe(6000);
        let center = position || (await geocodeCity(fallbackCity));
        if (!center) {
          throw new Error('Unable to determine location');
        }
        setCoords(center);

        const results = await fetchNearbyVets(center.lat, center.lng);
        const normalized = (results.results || []).map(r => ({
          id: r.place_id || `${r.name}-${r.vicinity}`,
          name: r.name,
          address: r.vicinity || r.formatted_address,
          rating: r.rating,
          userRatingsTotal: r.user_ratings_total,
          openNow: r.opening_hours?.open_now,
          location: r.geometry?.location ? { lat: r.geometry.location.lat, lng: r.geometry.location.lng } : null,
        }));
        setPlaces(normalized);
      } catch (err) {
        setError(err.message || 'Failed to load nearby vets');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [navigate, user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return places;
    return places.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.address || '').toLowerCase().includes(q)
    );
  }, [places, query]);

  // Load Google Maps JS API and draw map + markers
  useEffect(() => {
    if (!coords) return;
    let cancelled = false;

    (async () => {
      const g = await loadGoogleMaps(process.env.REACT_APP_GOOGLE_MAPS_API_KEY);
      if (cancelled || !g) return;

      // Initialize map once
      if (!mapInstanceRef.current && mapRef.current) {
        mapInstanceRef.current = new g.maps.Map(mapRef.current, {
          center: { lat: coords.lat, lng: coords.lng },
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
        });
      }

      // Center map when coords change
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter({ lat: coords.lat, lng: coords.lng });
      }

      // Clear existing markers
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];

      // Add a marker for user location
      if (mapInstanceRef.current) {
        const userMarker = new g.maps.Marker({
          position: { lat: coords.lat, lng: coords.lng },
          map: mapInstanceRef.current,
          title: 'You are here',
          icon: {
            path: g.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: '#1d4ed8',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#ffffff',
          },
        });
        markersRef.current.push(userMarker);
      }

      // Add vet markers
      const bounds = new g.maps.LatLngBounds();
      bounds.extend(new g.maps.LatLng(coords.lat, coords.lng));
      const info = new g.maps.InfoWindow();
      places.forEach(p => {
        if (!p.location || !mapInstanceRef.current) return;
        const marker = new g.maps.Marker({
          position: { lat: p.location.lat, lng: p.location.lng },
          map: mapInstanceRef.current,
          title: p.name,
        });
        marker.addListener('click', () => {
          info.setContent(`<div style="max-width:220px"><strong>${escapeHtml(p.name)}</strong><br/>${escapeHtml(p.address || '')}<br/>${p.rating ? `⭐ ${p.rating}` : ''}</div>`);
          info.open({ anchor: marker, map: mapInstanceRef.current });
        });
        markersRef.current.push(marker);
        bounds.extend(new g.maps.LatLng(p.location.lat, p.location.lng));
      });

      if (!bounds.isEmpty() && mapInstanceRef.current) {
        mapInstanceRef.current.fitBounds(bounds);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [coords, places]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/');
    } catch (e) {
      setError(e.message || 'Logout failed');
    }
  };

  return (
    <div className="screen-container">
      <div className="mobile-phone-frame">
        <div className="mobile-screen">
          <div className="screen-content with-bottom-nav">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate('/home')}>← Back</button>
          <h1 className="page-title">Nearby Vets</h1>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>

        <div className="search-section">
          <div className="search-container">
            <div className="search-icon">🔎</div>
            <input
              className="search-input"
              placeholder="Search for vets or pet services"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {loading && (
          <div style={{ padding: 16 }}><p>Loading nearby vets…</p></div>
        )}
        {error && (
          <div className="error-message" style={{ margin: 16 }}>
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <div className="vets-list">
          <div style={{ height: 360, margin: '16px', borderRadius: 12, overflow: 'hidden', border: '1px solid #E0E0E0' }}>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
          </div>
          {filtered.map(v => (
            <div key={v.id} className="vet-card">
              <div className="vet-header">
                <div className="vet-name">{v.name}</div>
                <div className="vet-address">{v.address}</div>
                <div className="vet-meta">
                  {v.rating ? <div className="vet-rating">⭐ {v.rating} ({v.userRatingsTotal || 0})</div> : null}
                  {typeof v.openNow === 'boolean' && (
                    <div className="vet-distance" style={{ color: v.openNow ? '#38A169' : '#DC2626' }}>
                      {v.openNow ? 'Open now' : 'Closed'}
                    </div>
                  )}
                  {coords && v.location && (
                    <div className="vet-distance">{formatDistance(coords, v.location)}</div>
                  )}
                </div>
              </div>

              <div className="vet-actions">
                {v.location && (
                  <a
                    className="action-button"
                    href={`https://www.google.com/maps/dir/?api=1&destination=${v.location.lat},${v.location.lng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Directions
                  </a>
                )}
                <a
                  className="action-button"
                  href={`https://www.google.com/search?q=${encodeURIComponent(v.name + ' ' + (v.address || ''))}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Search
                </a>
              </div>
            </div>
          ))}

          {!loading && filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-title">No results</div>
              <p className="empty-description">Try a different search or move to another area.</p>
            </div>
          )}
        </div>
          </div>
          <BottomNavigation userType="owner" />
        </div>
      </div>
    </div>
  );
}

async function getCurrentPositionSafe(timeoutMs = 6000) {
  if (!('geolocation' in navigator)) return null;
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) resolve(null);
    }, timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        settled = true;
        clearTimeout(timer);
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        settled = true;
        clearTimeout(timer);
        resolve(null);
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: timeoutMs }
    );
  });
}

async function geocodeCity(city) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(city)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

function formatDistance(a, b) {
  const d = haversine(a.lat, a.lng, b.lat, b.lng);
  return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// --- Google Maps Loader and helpers ---
function loadGoogleMaps(apiKey) {
  if (window.google && window.google.maps) return Promise.resolve(window.google);
  const existing = document.querySelector('script[data-google-maps]');
  if (existing) {
    return new Promise(resolve => {
      existing.addEventListener('load', () => resolve(window.google));
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey || '')}`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google-maps', '1');
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}