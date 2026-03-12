import { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Phone,
  MapPin,
  Navigation,
  Plus,
  Heart,
  Hospital,
  Trash2
} from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { apiGet, apiPost, apiDelete } from '../services/api';
import { useAuth } from '../context/AuthContext';

declare global {
  interface Window {
    openDirections: (lat: number, lng: number) => void;
    L: any;
  }
}

export function EmergencyHelpScreen() {
  const { userId } = useAuth();
  const [contacts, setContacts] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    // Add openDirections to window for Leaflet popups
    window.openDirections = (lat: number, lng: number) => {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    };

    if (userId) {
      loadInitialData();
      
      const refreshInterval = setInterval(() => {
        loadEmergencyContacts();
        shareLocation(); // Refresh location and hospitals
      }, 20000);
      
      return () => {
        clearInterval(refreshInterval);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }
  }, [userId]);

  // Update map markers when hospitals or location changes
  useEffect(() => {
    if (currentLocation && window.L) {
      const L = window.L;
      
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map("map").setView([currentLocation.lat, currentLocation.lng], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19
        }).addTo(mapInstanceRef.current);
      } else {
        mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lng]);
      }

      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // User marker
      const userMarker = L.marker([currentLocation.lat, currentLocation.lng])
        .addTo(mapInstanceRef.current)
        .bindPopup("Your Location")
        .openPopup();
      markersRef.current.push(userMarker);

      // Hospital markers
      hospitals.forEach(hospital => {
        const lat = hospital.latitude || 0;
        const lng = hospital.longitude || 0;
        if (lat && lng) {
          const marker = L.marker([lat, lng])
            .addTo(mapInstanceRef.current)
            .bindPopup(`<b>${hospital.hospital_name || hospital.name}</b><br>
                        Distance: ${hospital.distance || 'Nearby'}<br>
                        Status: ${hospital.open_status || (hospital.open ? 'Open' : 'Closed')}<br>
                        <button onclick="window.openDirections(${lat}, ${lng})" style="margin-top:5px; width:100%; padding:5px; background:#1E88E5; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">
                          Directions
                        </button>`);
          markersRef.current.push(marker);
        }
      });
    }
  }, [currentLocation, hospitals]);

  const loadInitialData = async () => {
    setIsLoading(true);
    await Promise.all([
      loadEmergencyContacts(),
      shareLocation()
    ]);
    setIsLoading(false);
  };

  const loadEmergencyContacts = async () => {
    try {
      const data = await apiGet('/api/emergency/contacts', { user_id: userId });
      setContacts(data);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const validatePhone = (phone: string) => {
    return /^\d{10}$/.test(phone);
  };

  const handleAddContact = async () => {
    if (contacts.length >= 3) {
      alert("You can only add up to 3 emergency contacts.");
      return;
    }
    if (!newContactName.trim()) {
      alert("Name cannot be empty.");
      return;
    }
    if (!validatePhone(newContactPhone)) {
      alert("Phone must be exactly 10 digits and only numbers allowed.");
      return;
    }

    try {
      await apiPost('/api/emergency/contact/add', {
        user_id: userId,
        role: 'patient',
        name: newContactName,
        phone: newContactPhone
      });
      setShowAddModal(false);
      setNewContactName('');
      setNewContactPhone('');
      loadEmergencyContacts();
    } catch (error) {
      alert("Failed to add contact");
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    if (!window.confirm("Are you sure you want to delete this contact?")) return;
    try {
      await apiDelete(`/api/emergency/contact/delete/${contactId}`);
      loadEmergencyContacts();
    } catch (error) {
      alert("Failed to delete contact");
    }
  };

  const shareLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        
        try {
          await apiPost('/api/emergency/location', {
            user_id: userId,
            role: 'patient',
            latitude,
            longitude
          });
          loadNearbyHospitals(latitude, longitude);
        } catch (error) {
          console.error("Failed to share location:", error);
        }
      });
    }
  };

  const loadNearbyHospitals = async (lat: number, lng: number) => {
    try {
      const data = await apiGet('/api/hospitals', { lat, lng });
      setHospitals(data);
    } catch (error) {
      console.error("Failed to load hospitals:", error);
    }
  };

  const handleSOS = async () => {
    if (!window.confirm("Send emergency SOS alert to all your contacts?")) return;
    try {
      setIsLoading(true);
      await apiPost('/api/emergency/sos', {
        user_id: userId,
        role: 'patient'
      });
      alert("SOS alert sent to your emergency contacts!");
    } catch (error) {
      alert("Failed to send SOS alert");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <ScreenContainer showBack className="bg-white">
      {/* Red Header Banner */}
      <div className="bg-[#E53935] text-white px-6 pt-8 pb-12 rounded-b-[32px] shadow-lg mb-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <AlertTriangle size={28} />
            </div>
            <h1 className="text-3xl font-bold">Emergency Help</h1>
          </div>
          <button 
            onClick={handleSOS}
            disabled={isLoading}
            className="bg-white text-[#E53935] px-4 py-2 rounded-xl font-bold text-lg animate-pulse shadow-lg active:scale-95 transition-transform"
          >
            SOS
          </button>
        </div>
        <p className="text-red-100 mb-8 text-base leading-relaxed max-w-2xl">
          If you are in a life-threatening situation, call for an ambulance immediately.
        </p>

        {/* PRIMARY CTA — white bg, red text, always visible */}
        <button
          className="w-full max-w-md h-20 bg-white rounded-2xl flex items-center justify-center gap-4 shadow-xl border-2 border-red-100 active:scale-95 transition-transform mx-auto"
          onClick={() => handleCall('102')}
        >
          <Phone size={28} className="text-[#E53935] animate-pulse" />
          <span className="text-[#E53935] text-xl font-bold">
            Call Ambulance (102)
          </span>
        </button>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-4 mt-6 max-w-md mx-auto">
          <button 
            onClick={shareLocation}
            className="h-14 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl flex items-center justify-center gap-2 text-white text-sm font-medium active:scale-95 transition-transform"
          >
            <MapPin size={20} />
            Share Location
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="h-14 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl flex items-center justify-center gap-2 text-white text-sm font-medium active:scale-95 transition-transform"
          >
            <Plus size={20} />
            Add Contact
          </button>
        </div>
      </div>

      <div className="px-6 pb-8 space-y-10">
        {/* Emergency Contacts */}
        <div>
          <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-3">
            <Heart size={24} className="text-red-500" /> Emergency Contacts
          </h3>
          <div className="space-y-4">
            {contacts.length > 0 ? (
              contacts.map((contact) => (
                <Card
                  key={contact.id}
                  className="flex items-center justify-between p-5 border-l-4 border-l-[#E53935]"
                >
                  <div className="flex-1">
                    <h4 className="font-bold text-text-primary text-lg">
                      {contact.name}
                    </h4>
                    <p className="text-base text-text-secondary">
                      {contact.phone}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleCall(contact.phone)}
                      className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <Phone size={24} />
                    </button>
                    <button 
                      onClick={() => handleDeleteContact(contact.id)}
                      className="w-12 h-12 rounded-full bg-red-50 text-[#E53935] flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <Trash2 size={24} />
                    </button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-text-secondary">No emergency contacts added</p>
              </div>
            )}
            {contacts.length < 3 && (
              <Button 
                variant="outline" 
                fullWidth 
                icon={<Plus size={20} />}
                onClick={() => setShowAddModal(true)}
              >
                Add Emergency Contact
              </Button>
            )}
            {contacts.length >= 3 && (
              <p className="text-xs text-text-secondary text-center italic">
                You have reached the limit of 3 emergency contacts.
              </p>
            )}
          </div>
        </div>

        {/* Nearby Hospitals */}
        <div>
          <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-3">
            <Hospital size={24} className="text-[#1E88E5]" /> Nearby Hospitals
          </h3>
          
          {/* Leaflet Map Container */}
          <div 
            id="map"
            className="w-full h-64 bg-gray-100 rounded-2xl mb-6 overflow-hidden border border-gray-200"
            style={{ zIndex: 1 }}
          />

          <div className="space-y-4">
            {hospitals.length > 0 ? (
              hospitals.map((hospital, i) => (
                <Card key={i} className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-text-primary text-lg">
                        {hospital.hospital_name || hospital.name}
                      </h4>
                      <p className="text-sm text-text-secondary mt-1">
                        {hospital.address || 'Nearby Hospital Address'}
                      </p>
                      <span
                        className={`text-sm font-medium mt-2 inline-block ${hospital.open_status === 'Open' || hospital.open ? 'text-green-600' : 'text-red-500'}`}
                      >
                        {hospital.open_status === 'Open' || hospital.open ? '● Open' : '● Closed'}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-[#1E88E5] bg-blue-50 px-3 py-1.5 rounded-lg whitespace-nowrap">
                      {hospital.distance || hospital.dist || 'Nearby'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    fullWidth
                    icon={<Navigation size={18} />}
                    onClick={() => window.openDirections(hospital.latitude || 0, hospital.longitude || 0)}
                  >
                    Get Directions
                  </Button>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <Hospital size={40} className="text-gray-200 mx-auto mb-3" />
                <p className="text-text-secondary">Searching for nearby hospitals...</p>
                <p className="text-xs text-text-secondary mt-1 px-8">Enable GPS to see medical facilities near you.</p>
              </div>
            )}
          </div>
        </div>

        {/* Safety Tips */}
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
          <h4 className="font-bold text-[#1E88E5] mb-3 text-lg">Safety Tips</h4>
          <ul className="list-disc pl-6 space-y-2 text-base text-blue-800">
            <li>Stay calm and do not panic.</li>
            <li>Keep your location services on for real-time tracking.</li>
            <li>Have your medical ID ready for emergency responders.</li>
          </ul>
        </div>
      </div>

      {/* Add Contact Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Emergency Contact"
        confirmText="Save Contact"
        onConfirm={handleAddContact}
      >
        <div className="space-y-4">
          <Input 
            label="Contact Name" 
            placeholder="e.g. Spouse, Parent"
            value={newContactName}
            onChange={(e) => setNewContactName(e.target.value)}
          />
          <Input 
            label="Phone Number" 
            placeholder="Exactly 10 digits"
            value={newContactPhone}
            onChange={(e) => setNewContactPhone(e.target.value)}
            type="tel"
          />
          <p className="text-xs text-text-secondary italic">
            Phone must be exactly 10 digits. Maximum 3 contacts allowed.
          </p>
        </div>
      </Modal>
    </ScreenContainer>
  );
}