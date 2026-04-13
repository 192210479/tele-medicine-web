import { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Phone,
  MapPin,
  Navigation,
  Plus,
  Heart,
  Hospital,
  X,
  Trash2
} from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { emergencyService } from '../services/api';

export function EmergencyHelpScreen() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    relation: '',
    phone: ''
  });

  const rawUserId = localStorage.getItem('user_id') || localStorage.getItem('auth_token');
  const userId = rawUserId || '0';

  const fetchContacts = async () => {
    setIsLoadingContacts(true);
    try {
      const data = await emergencyService.getContacts(Number(userId), 'patient');
      setContacts(data);
    } catch (err) {
      console.error('Failed to fetch contacts', err);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const fetchHospitals = async (lat?: number, lng?: number) => {
    setIsLoadingHospitals(true);
    try {
      let data = await emergencyService.getHospitals(lat, lng);

      // Fallback: If backend returns empty (no API key/DB fallback empty) but we have coordinates,
      // use the free Overpass API to fetch real hospitals globally end-to-end to ensure functionality.
      if ((!data || data.length === 0) && lat && lng) {
        try {
          const overpassQuery = `[out:json];(node["amenity"="hospital"](around:5000,${lat},${lng});way["amenity"="hospital"](around:5000,${lat},${lng}););out center;`;
          const res = await fetch("https://overpass-api.de/api/interpreter", {
            method: 'POST',
            body: overpassQuery
          });
          if (res.ok) {
            const overpassData = await res.json();
            if (overpassData.elements && overpassData.elements.length > 0) {
              data = overpassData.elements.slice(0, 10).map((el: any) => {
                const hLat = el.lat || el.center?.lat;
                const hLon = el.lon || el.center?.lon;
                
                // Haversine distance
                const R = 6371; 
                const dLat = (hLat - lat) * Math.PI / 180;
                const dLon = (hLon - lng) * Math.PI / 180;
                const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                          Math.cos(lat * Math.PI / 180) * Math.cos(hLat * Math.PI / 180) * 
                          Math.sin(dLon/2) * Math.sin(dLon/2);
                const d = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
                
                return {
                  id: el.id.toString(),
                  name: el.tags?.name || "Local Hospital",
                  address: el.tags?.['addr:street'] ? `${el.tags['addr:street']} ${el.tags['addr:city'] || ''}` : "Nearby Facility",
                  distance: `${d.toFixed(1)} km`,
                  status: "Open 24/7",
                  latitude: hLat,
                  longitude: hLon,
                  map_link: `https://www.google.com/maps/search/?api=1&query=${hLat},${hLon}`
                };
              }).sort((a: any, b: any) => parseFloat(a.distance) - parseFloat(b.distance));
            }
          }
        } catch (e) {
          console.error("Overpass fallback failed", e);
        }
      }

      setHospitals(data || []);
    } catch (err) {
      console.error('Hospital fetch error', err);
    } finally {
      setIsLoadingHospitals(false);
    }
  };

  const watchIdRef = useRef<number | null>(null);

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(coords);
        setLocationError(null);
        fetchHospitals(coords.lat, coords.lng);
      },
      (err) => {
        setLocationError("Location access denied. Please enable location to find nearby hospitals.");
        console.error(err);
      }
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );
  };

  useEffect(() => {
    fetchContacts();
    fetchHospitals(); // Initial fallback load
    startLocationTracking();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const contactName = formData.name + (formData.relation ? ` (${formData.relation})` : '');
      await emergencyService.addContact({
        user_id: Number(userId),
        role: 'patient',
        name: contactName,
        phone: formData.phone
      });

      alert('Contact added successfully');
      setIsModalOpen(false);
      setFormData({ name: '', relation: '', phone: '' });
      fetchContacts(); // REAL-TIME UPDATE
    } catch (err: any) {
      console.error('Error adding contact', err);
      alert(err.message || 'Failed to add contact');
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      await emergencyService.deleteContact(contactId);
      fetchContacts();
    } catch (err: any) {
      console.error('Error deleting contact', err);
      alert(err.message || 'Failed to delete contact');
    }
  };

  const handleShareLocation = async () => {
    if (!location) {
      alert("Location not available. Please allow location access first.");
      return;
    }
    try {
      const res = await emergencyService.shareLocation({
        user_id: Number(userId),
        role: 'patient',
        latitude: location.lat,
        longitude: location.lng
      });
      
      // Dispatch real-time SMS to actual external contact phones
      const mapsUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
      const text = `EMERGENCY ALERT: I need your help. My live location: ${mapsUrl}`;
      
      if (contacts && contacts.length > 0) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const separator = isIOS ? ',' : ';';
        const phoneList = contacts.map((c: any) => c.phone).join(separator);
        
        setTimeout(() => {
          window.open(`sms:${phoneList}${isIOS ? '&' : '?'}body=${encodeURIComponent(text)}`, '_self');
        }, 500);
      } else {
        setTimeout(() => {
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        }, 500);
      }

      alert(res.message || "Location shared successfully");
    } catch (err: any) {
       console.error("Failed to share location", err);
       alert(err.message || "Failed to share location");
    }
  };

  const handleSOS = async () => {
    if (!location) {
      alert("Location not available. Please allow location access for tracking.");
      return;
    }
    try {
      const res = await emergencyService.sendSOS({
        user_id: Number(userId),
        role: 'patient',
        latitude: location.lat,
        longitude: location.lng
      });
      
      const mapsUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
      const text = `SOS EMERGENCY TRIGGERED! I am in danger. My live location: ${mapsUrl}`;
      
      if (contacts && contacts.length > 0) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const separator = isIOS ? ',' : ';';
        const phoneList = contacts.map((c: any) => c.phone).join(separator);
        
        setTimeout(() => {
          window.open(`sms:${phoneList}${isIOS ? '&' : '?'}body=${encodeURIComponent(text)}`, '_self');
        }, 500);
      }

      alert(res.message || "SOS alert triggered and contacts notified");
    } catch (err: any) {
      console.error("Failed to trigger SOS", err);
      alert(err.message || "Failed to trigger SOS");
    }
  };

  return (
    <ScreenContainer showBack title="Emergency Help" className="bg-white">
      {/* Red Header Banner */}
      <div className="bg-[#D32F2F] text-white px-6 pt-5 pb-10 rounded-b-[32px] shadow-lg mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <AlertTriangle size={28} />
          </div>
          <h1 className="text-2xl font-bold">Emergency Assistance</h1>
        </div>
        <p className="text-red-50/90 mb-8 text-sm leading-relaxed max-w-2xl">
          In case of a critical emergency, please contact the ambulance service directly.
        </p>

        {/* PRIMARY CTA */}
        <a
          href="tel:102"
          className="w-full max-w-sm h-16 bg-white rounded-2xl flex items-center justify-center gap-3 shadow-xl border-2 border-red-50 active:scale-[0.98] transition-all mx-auto no-underline">
          <Phone size={24} className="text-[#D32F2F] animate-pulse" />
          <span className="text-[#D32F2F] text-lg font-bold">
            Call Ambulance (102)
          </span>
        </a>

        {/* Action Grid */}
        <div className="grid grid-cols-3 gap-3 mt-8 max-w-md mx-auto">
          <button 
             onClick={handleSOS}
             className="h-14 bg-red-600 border border-white/20 rounded-xl flex flex-col items-center justify-center gap-1 text-white text-xs font-bold hover:bg-red-700 transition-all shadow-md animate-pulse">
            <AlertTriangle size={20} />
            SOS Alert
          </button>
          <button 
            onClick={handleShareLocation}
            className="h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex flex-col items-center justify-center gap-1 text-white text-xs font-semibold hover:bg-white/20 transition-all">
             <MapPin size={20} />
             Share Location
          </button>
          <button 
             onClick={() => setIsModalOpen(true)}
             className="h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex flex-col items-center justify-center gap-1 text-white text-xs font-semibold hover:bg-white/20 transition-all">
             <Plus size={20} />
             Add Contact
          </button>
        </div>
      </div>

      <div className="px-6 pb-12 space-y-10">
        {/* Geolocation Notice */}
        {locationError && (
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3 items-center text-amber-800 text-sm">
            <MapPin size={20} className="shrink-0" />
            <p>{locationError}</p>
          </div>
        )}

        {/* Emergency Contacts Section */}
        <div>
          <h3 className="text-lg font-extrabold text-[#1a1c1e] mb-5 flex items-center gap-2.5">
            <Heart size={22} className="text-[#D32F2F] fill-[#D32F2F]" /> My Emergency Contacts
          </h3>
          <div className="space-y-3">
            {isLoadingContacts ? (
              <p className="text-sm text-gray-500 text-center py-4">Loading contacts...</p>
            ) : contacts.length > 0 ? (
              contacts.map((contact) =>
              <Card
                key={contact.id}
                className="flex items-center justify-between p-4 border-l-4 border-l-[#D32F2F] shadow-sm">
                  <div>
                    <h4 className="font-bold text-gray-900 leading-tight">
                      {contact.name}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {contact.phone}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleDeleteContact(contact.id)}
                      className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors">
                      <Trash2 size={18} />
                    </button>
                    <button 
                      onClick={() => window.location.href = `tel:${contact.phone}`}
                      className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors">
                      <Phone size={20} />
                    </button>
                  </div>
                </Card>
              )
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-400">No emergency contacts added yet.</p>
              </div>
            )}
            <Button 
               variant="outline" 
               fullWidth 
               icon={<Plus size={18} />}
               onClick={() => setIsModalOpen(true)}>
              Add New Contact
            </Button>
          </div>
        </div>

        {/* Nearby Hospitals Section */}
        <div>
          <h3 className="text-lg font-extrabold text-[#1a1c1e] mb-5 flex items-center gap-2.5">
            <Hospital size={22} className="text-[#1565C0] fill-[#1565C0]" /> Hospitals Near You
          </h3>
          <div className="space-y-4">
            {isLoadingHospitals ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <div className="w-8 h-8 border-3 border-[#1565C0] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-gray-400">Finding nearby hospitals...</p>
              </div>
            ) : hospitals.length > 0 ? (
              hospitals.map((hospital, i) =>
              <Card key={i} className="p-4 bg-white border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="max-w-[70%]">
                    <h4 className="font-bold text-gray-900 text-base leading-tight">
                      {hospital.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1.5 truncate">
                      {hospital.address}
                    </p>
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md mt-2 inline-block uppercase tracking-wider">
                      Open 24/7
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-[#1565C0] bg-blue-50 px-2.5 py-1 rounded-lg">
                      {hospital.distance}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  fullWidth
                  className="h-10 text-xs font-bold border-gray-100"
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`, '_blank')}
                  icon={<Navigation size={14} />}>
                  Get Directions
                </Button>
              </Card>
              )
            ) : location ? (
              <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-400">No hospitals found nearby.</p>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-400 mb-3">Enable location to find nearest hospitals via Maps.</p>
                <Button variant="outline" size="sm" onClick={startLocationTracking}>Enable Location</Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-xs animate-in fade-in zoom-in duration-200 p-6 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-900">
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold mb-6">New Emergency Contact</h3>
            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full h-11 px-3 mt-1 rounded-lg border border-gray-200 text-sm focus:border-primary focus:outline-none"
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Relation</label>
                <input 
                  required
                  type="text" 
                  value={formData.relation}
                  onChange={e => setFormData({...formData, relation: e.target.value})}
                  className="w-full h-11 px-3 mt-1 rounded-lg border border-gray-200 text-sm focus:border-primary focus:outline-none"
                  placeholder="e.g. Sister, Friend"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
                <input 
                  required
                  type="tel" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full h-11 px-3 mt-1 rounded-lg border border-gray-200 text-sm focus:border-primary focus:outline-none"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <Button fullWidth type="submit" className="mt-4">Save Contact</Button>
            </form>
          </Card>
        </div>
      )}
    </ScreenContainer>
  );
}
