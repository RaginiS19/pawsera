import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../api/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { logoutUser } from '../../api/authService';
import { getDummyApprovedVets } from '../../api/dummyData';
import BottomNavigation from '../common/BottomNavigation';

export default function NearbyVets() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [vets, setVets] = useState([]);

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
        // Try to load vets from Firestore
        if (db) {
          try {
            const vetsSnap = await getDoc(doc(db, 'vets', 'all'));
            if (vetsSnap.exists()) {
              const vetsData = vetsSnap.data();
              const vetList = Array.isArray(vetsData.vets) ? vetsData.vets : [];
              if (vetList.length > 0) {
                setVets(vetList);
                setLoading(false);
                return;
              }
            }
          } catch (firestoreErr) {
            console.warn('Could not load vets from Firestore:', firestoreErr);
          }
        }

        // Fallback to dummy data
        const dummyVets = getDummyApprovedVets();
        const formattedVets = dummyVets.map(vet => ({
          id: vet.id,
          name: vet.name,
          clinic: vet.clinic || vet.name,
          specialization: vet.specialization || 'General Practice',
          phone: vet.phone || 'N/A',
          rating: vet.rating || 4.5,
          experience: vet.experience || 'N/A',
          address: `${vet.clinic || 'Veterinary Clinic'}, Toronto, ON`,
          openNow: Math.random() > 0.3, // Random open/closed status
        }));
        setVets(formattedVets);
      } catch (err) {
        console.error('Error loading vets:', err);
        setError('Unable to load veterinarians. Please try again later.');
        // Still show dummy data
        const dummyVets = getDummyApprovedVets();
        const formattedVets = dummyVets.map(vet => ({
          id: vet.id,
          name: vet.name,
          clinic: vet.clinic || vet.name,
          specialization: vet.specialization || 'General Practice',
          phone: vet.phone || 'N/A',
          rating: vet.rating || 4.5,
          experience: vet.experience || 'N/A',
          address: `${vet.clinic || 'Veterinary Clinic'}, Toronto, ON`,
          openNow: Math.random() > 0.3,
        }));
        setVets(formattedVets);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [navigate, user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vets;
    return vets.filter(v =>
      (v.name || '').toLowerCase().includes(q) ||
      (v.clinic || '').toLowerCase().includes(q) ||
      (v.specialization || '').toLowerCase().includes(q) ||
      (v.address || '').toLowerCase().includes(q)
    );
  }, [vets, query]);

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

            <div className="search-section" style={{ padding: '16px', paddingBottom: '8px' }}>
              <div className="search-container" style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#F3F4F6',
                borderRadius: '12px',
                padding: '10px 16px',
                gap: '12px'
              }}>
                <div style={{ fontSize: '20px' }}>🔎</div>
                <input
                  className="search-input"
                  placeholder="Search veterinarians, clinics, or specialties"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '14px',
                    color: '#1F2937'
                  }}
                />
              </div>
            </div>

            {error && (
              <div style={{ 
                margin: '0 16px 16px', 
                padding: '12px', 
                backgroundColor: '#FEF3C7', 
                border: '1px solid #FCD34D', 
                borderRadius: '8px',
                color: '#92400E',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="vets-list" style={{ padding: '0 16px 16px' }}>
              {loading && (
                <div style={{ 
                  padding: '40px 20px', 
                  textAlign: 'center', 
                  color: '#6B7280',
                  fontSize: '14px'
                }}>
                  Loading veterinarians...
                </div>
              )}

              {!loading && filtered.length > 0 && (
                <>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#6B7280', 
                    marginBottom: '12px',
                    fontWeight: '500'
                  }}>
                    Found {filtered.length} {filtered.length === 1 ? 'veterinarian' : 'veterinarians'}
                  </div>
                  {filtered.map(vet => (
                    <div 
                      key={vet.id} 
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        border: '1px solid #E5E7EB'
                      }}
                    >
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ 
                          fontSize: '18px', 
                          fontWeight: '600', 
                          color: '#1F2937',
                          marginBottom: '4px'
                        }}>
                          {vet.name}
                        </div>
                        <div style={{ 
                          fontSize: '15px', 
                          color: '#F7931E',
                          fontWeight: '500',
                          marginBottom: '6px'
                        }}>
                          {vet.clinic}
                        </div>
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#6B7280',
                          marginBottom: '8px'
                        }}>
                          📍 {vet.address}
                        </div>
                      </div>

                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '12px',
                        marginBottom: '12px',
                        paddingBottom: '12px',
                        borderBottom: '1px solid #E5E7EB'
                      }}>
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#1F2937',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          ⭐ <strong>{vet.rating}</strong> Rating
                        </div>
                        <div style={{ 
                          fontSize: '13px',
                          fontWeight: '500',
                          color: vet.openNow ? '#059669' : '#DC2626',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {vet.openNow ? '🟢 Open now' : '🔴 Closed'}
                        </div>
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#6B7280'
                        }}>
                          🏥 {vet.specialization}
                        </div>
                      </div>

                      <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        fontSize: '13px',
                        color: '#6B7280',
                        marginBottom: '12px'
                      }}>
                        <div>📞 {vet.phone}</div>
                        <div>💼 {vet.experience}</div>
                      </div>

                      <div className="vet-actions" style={{ 
                        display: 'flex', 
                        gap: '8px', 
                        marginTop: '8px'
                      }}>
                        <a
                          href={`tel:${vet.phone}`}
                          style={{
                            flex: 1,
                            padding: '10px 16px',
                            backgroundColor: '#F7931E',
                            color: '#FFFFFF',
                            borderRadius: '8px',
                            textAlign: 'center',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#E67E22'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#F7931E'}
                        >
                          📞 Call
                        </a>
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(vet.clinic + ' ' + vet.address)}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            flex: 1,
                            padding: '10px 16px',
                            backgroundColor: '#FFFFFF',
                            color: '#1F2937',
                            borderRadius: '8px',
                            textAlign: 'center',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: '500',
                            border: '1px solid #D1D5DB',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#F9FAFB'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#FFFFFF'}
                        >
                          🔍 Search
                        </a>
                        <button
                          onClick={() => navigate('/schedule', { state: { vetName: vet.name, vetAddress: vet.address } })}
                          style={{
                            flex: 1,
                            padding: '10px 16px',
                            backgroundColor: '#10B981',
                            color: '#FFFFFF',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#10B981'}
                        >
                          📅 Book
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {!loading && filtered.length === 0 && (
                <div className="empty-state" style={{
                  padding: '40px 20px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: '#1F2937',
                    marginBottom: '8px'
                  }}>
                    No veterinarians found
                  </div>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#6B7280',
                    marginBottom: '16px'
                  }}>
                    Try a different search term.
                  </p>
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
