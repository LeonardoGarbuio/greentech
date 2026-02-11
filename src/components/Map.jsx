import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon issues in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Emoji Icons
const createEmojiIcon = (emoji) => {
    return L.divIcon({
        className: 'custom-emoji-icon',
        html: `<div style="font-size: 2rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">${emoji}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
};

const getIconForType = (type) => {
    switch (type) {
        case 'paper': return createEmojiIcon('📦');
        case 'plastic': return createEmojiIcon('🥤');
        case 'glass': return createEmojiIcon('🍾');
        case 'metal': return createEmojiIcon('🥫');
        case 'electronic': return createEmojiIcon('🔌');
        default: return createEmojiIcon('📍');
    }
};

// Component to update map center when items change
const MapUpdater = ({ items }) => {
    const map = useMap();

    const [hasFitBounds, setHasFitBounds] = useState(false);

    useEffect(() => {
        if (items.length > 0 && !hasFitBounds) {
            const bounds = L.latLngBounds(items.map(i => [i.lat, i.lng]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            setHasFitBounds(true);
        }
    }, [items, map, hasFitBounds]);

    return null;
};

// Component to control map view (flyTo)
const MapController = ({ center }) => {
    const map = useMap();

    useEffect(() => {
        if (center) {
            map.flyTo(center, 15, {
                animate: true,
                duration: 1.5
            });
        }
    }, [center, map]);

    return null;
};

const Map = ({ items = [], onMarkerClick, center }) => {
    // Default center (Sao Paulo)
    const defaultCenter = [-23.5505, -46.6333];

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 0 }}>
            <MapContainer
                center={defaultCenter}
                zoom={13}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false} // Hide default zoom control for cleaner look
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                {/* Clean, light map style (CartoDB Voyager) */}

                {items.map(item => (
                    <Marker
                        key={item.id}
                        position={[item.lat, item.lng]}
                        icon={getIconForType(item.type)}
                        eventHandlers={{
                            click: () => onMarkerClick && onMarkerClick(item),
                        }}
                    >
                        <Popup>
                            <strong>{item.title}</strong><br />
                            {item.description}
                        </Popup>
                    </Marker>
                ))}

                {/* User Location Marker (Mock) */}
                <Marker
                    position={[-23.5505, -46.6333]}
                    icon={L.divIcon({
                        className: 'user-location',
                        html: '<div style="width: 20px; height: 20px; background: #3498db; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.2);"></div>',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    })}
                />

                <MapUpdater items={items} />
                <MapController center={center} />
            </MapContainer>
        </div>
    );
};

export default Map;
