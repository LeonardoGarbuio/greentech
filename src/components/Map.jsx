import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
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

// Static icons cache to prevent Leaflet marker redraw lag on every polling update
const iconsCache = {
    paper: createEmojiIcon('📦'),
    plastic: createEmojiIcon('🥤'),
    glass: createEmojiIcon('🍾'),
    metal: createEmojiIcon('🥫'),
    electronic: createEmojiIcon('🔌'),
    default: createEmojiIcon('📍'),
    userLocation: L.divIcon({
        className: 'user-location',
        html: '<div style="width: 24px; height: 24px; background: #3b82f6; border: 3.5px solid white; border-radius: 50%; box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.35); animation: pulse 2s infinite;"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    }),
    coopLocation: L.divIcon({
        className: 'cooperative-location',
        html: `
            <div style="
                width: 44px;
                height: 44px;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                border-radius: 50%;
                border: 3.5px solid white;
                box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.4rem;
            ">
                🏢
            </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
    })
};

const getIconForType = (type) => {
    return iconsCache[type] || iconsCache.default;
};

// Smart MapUpdater: fits bounds only once on initial load or when the actual optimized route list changes.
// This allows the user to freely explore/pan/zoom the map without annoying snapping during background updates.
const MapUpdater = ({ items, routeCoordinates, optimizedRoute }) => {
    const map = useMap();
    const hasFittedInitial = useRef(false);
    const prevRouteIdStr = useRef('');

    const routeIdStr = optimizedRoute && optimizedRoute.optimizedRoute 
        ? optimizedRoute.optimizedRoute.join(',') 
        : '';

    useEffect(() => {
        if (routeIdStr) {
            // Only fit bounds if the route items themselves have changed
            if (routeIdStr !== prevRouteIdStr.current) {
                if (routeCoordinates && routeCoordinates.length > 0) {
                    const bounds = L.latLngBounds(routeCoordinates);
                    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
                    prevRouteIdStr.current = routeIdStr;
                }
            }
        } else if (items && items.length > 0 && !hasFittedInitial.current) {
            // Fit bounds only on the initial load of items
            const bounds = L.latLngBounds(items.map(i => [i.lat, i.lng]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            hasFittedInitial.current = true;
        }
    }, [items, routeCoordinates, routeIdStr, map]);

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

const Map = ({ items = [], onMarkerClick, center, optimizedRoute = null, userCoords = null }) => {
    // Default center (Sao Paulo)
    const defaultCenter = [-23.5505, -46.6333];

    // Compute route coordinates if optimizedRoute is present
    const startLocation = userCoords ? [userCoords.lat, userCoords.lng] : [-23.5505, -46.6333];
    const coopLocation = [-23.5605, -46.6233]; // Coopercaps Centro in SP

    const routeCoordinates = [];
    if (optimizedRoute && optimizedRoute.optimizedRoute && optimizedRoute.optimizedRoute.length > 0) {
        // Start at collector location
        routeCoordinates.push(startLocation);
        
        // Add each optimized item's location
        optimizedRoute.optimizedRoute.forEach(id => {
            const item = items.find(i => i.id === id);
            if (item) {
                routeCoordinates.push([item.lat, item.lng]);
            }
        });
        
        // End at Coop location
        routeCoordinates.push(coopLocation);
    }

    // State for high-fidelity street routing coordinates from OSRM
    const [streetCoordinates, setStreetCoordinates] = useState([]);

    useEffect(() => {
        if (routeCoordinates.length < 2) {
            setStreetCoordinates([]);
            return;
        }

        const fetchStreetRoute = async () => {
            try {
                // OSRM coordinates are in lng,lat format separated by semicolons
                const coordsQuery = routeCoordinates.map(coord => `${coord[1]},${coord[0]}`).join(';');
                const url = `https://router.project-osrm.org/route/v1/driving/${coordsQuery}?overview=full&geometries=geojson`;
                
                const res = await fetch(url);
                if (!res.ok) throw new Error("OSRM API error");
                
                const data = await res.json();
                if (data.code === 'Ok' && data.routes && data.routes[0]) {
                    const geojsonCoords = data.routes[0].geometry.coordinates;
                    // Convert back to [lat, lng] for Leaflet
                    const leafletCoords = geojsonCoords.map(c => [c[1], c[0]]);
                    setStreetCoordinates(leafletCoords);
                } else {
                    setStreetCoordinates(routeCoordinates);
                }
            } catch (error) {
                console.error("Failed to fetch OSRM street route, falling back to direct line:", error);
                setStreetCoordinates(routeCoordinates);
            }
        };

        fetchStreetRoute();
    }, [JSON.stringify(routeCoordinates)]);

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

                {/* User Location Marker */}
                <Marker
                    position={startLocation}
                    icon={iconsCache.userLocation}
                />

                {/* Cooperative Marker if optimizedRoute is active */}
                {optimizedRoute && (
                    <Marker
                        position={coopLocation}
                        icon={iconsCache.coopLocation}
                    >
                        <Popup>
                            <strong>Coopercaps Centro</strong><br />
                            Destino final para entrega dos materiais e homologação de peso.
                        </Popup>
                    </Marker>
                )}

                {/* Draw Route Polyline */}
                {streetCoordinates.length > 1 && (
                    <Polyline
                        positions={streetCoordinates}
                        pathOptions={{
                            color: '#10b981', // Emerald green
                            weight: 6,
                            opacity: 0.85,
                            dashArray: '12, 12',
                            lineJoin: 'round',
                            lineCap: 'round',
                            className: 'route-animation-path'
                        }}
                    />
                )}

                <MapUpdater 
                    items={items} 
                    routeCoordinates={streetCoordinates.length > 0 ? streetCoordinates : routeCoordinates} 
                    optimizedRoute={optimizedRoute}
                />
                <MapController center={center} />
            </MapContainer>
        </div>
    );
};

export default Map;
