import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet icon issues in React
// Only run this if window is defined (client-side)
if (typeof window !== 'undefined') {
    try {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
    } catch (e) {
        console.warn("Leaflet icon fix failed", e);
    }
}

// Helper to get color by type
const getTypeColor = (type) => {
    switch (type) {
        case 'paper': return '#f1c40f';
        case 'plastic': return '#e74c3c';
        case 'glass': return '#2ecc71';
        case 'electronic': return '#9b59b6';
        default: return '#27ae60'; // Primary Green
    }
};

// Helper to get icon by type
const getTypeIcon = (type) => {
    switch (type) {
        case 'paper': return '📦';
        case 'plastic': return '🥤';
        case 'glass': return '🍾';
        case 'metal': return '🥫';
        case 'electronic': return '🔌';
        default: return '♻️';
    }
};

// Custom Marker Component
const createCustomIcon = (type) => {
    const color = getTypeColor(type);
    const iconChar = getTypeIcon(type);

    return L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="
                width: 48px;
                height: 48px;
                background-color: ${color};
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                position: relative;
            ">
                <span style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">${iconChar}</span>
                <div style="
                    position: absolute;
                    bottom: -6px;
                    left: 50%;
                    transform: translateX(-50%) rotate(45deg);
                    width: 12px;
                    height: 12px;
                    background-color: ${color};
                    z-index: -1;
                "></div>
            </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 54], // Center bottom (48/2, 48 + 6)
        popupAnchor: [0, -54]
    });
};

// Component to handle map bounds updates
const MapUpdater = ({ items }) => {
    const map = useMap();

    useEffect(() => {
        if (items && items.length > 0) {
            const bounds = L.latLngBounds(items.map(item => [item.lat, item.lng]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [items, map]);

    return null;
};

const MapComponent = ({ items, onMarkerClick }) => {
    // Default center (São Paulo) if no items
    const defaultCenter = [-23.5505, -46.6333];

    return (
        <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            zoomControl={false} // We can add custom zoom controls if needed
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {items.map((item) => (
                <Marker
                    key={item.id}
                    position={[item.lat, item.lng]}
                    icon={createCustomIcon(item.type)}
                    eventHandlers={{
                        click: () => onMarkerClick(item),
                    }}
                />
            ))}

            <MapUpdater items={items} />
        </MapContainer>
    );
};

export default MapComponent;
