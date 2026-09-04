import React, { useEffect, useMemo, useState, useRef } from 'react';
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
    }),
    approximateCoopLocation: L.divIcon({
        className: 'cooperative-location-approximate',
        html: `
            <div style="
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                border-radius: 50%;
                border: 3.5px solid white;
                box-shadow: 0 4px 15px rgba(217, 119, 6, 0.35);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 1.25rem;
            ">
                ?
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    })
};

const getIconForType = (type) => {
    return iconsCache[type] || iconsCache.default;
};

// Smart MapUpdater: fits bounds only once on initial load or when the actual optimized route list changes.
// This allows the user to freely explore/pan/zoom the map without annoying snapping during background updates.
const MapUpdater = ({ items, cooperatives, routeCoordinates }) => {
    const map = useMap();
    const hasFittedInitial = useRef(false);
    const lastRouteKey = useRef('');

    useEffect(() => {
        // Only fit bounds on the initial load of items
        const visiblePoints = [...items, ...cooperatives];
        if (visiblePoints.length > 0 && !hasFittedInitial.current) {
            const bounds = L.latLngBounds(visiblePoints.map(point => [point.lat, point.lng]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            hasFittedInitial.current = true;
        }
    }, [items, cooperatives, map]);

    useEffect(() => {
        if (routeCoordinates.length < 2) return;
        const routeKey = routeCoordinates.map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join('|');
        if (routeKey === lastRouteKey.current) return;
        map.fitBounds(L.latLngBounds(routeCoordinates), { padding: [70, 70], maxZoom: 15 });
        lastRouteKey.current = routeKey;
    }, [routeCoordinates, map]);

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

const Map = ({ items = [], cooperatives = [], onMarkerClick, center, optimizedRoute = null, userCoords = null, destinationCooperative = null, autoRouteEnabled = false }) => {
    // Visão nacional até que a localização do usuário ou uma busca defina a cidade.
    const defaultCenter = userCoords ? [userCoords.lat, userCoords.lng] : [-14.235, -51.9253];
    const controlledCenter = useMemo(
        () => center || (userCoords ? [userCoords.lat, userCoords.lng] : null),
        [center, userCoords]
    );

    // Compute route coordinates if optimizedRoute is present
    const startLocation = userCoords ? [userCoords.lat, userCoords.lng] : defaultCenter;
    const routeCooperative = destinationCooperative || cooperatives[0];
    const coopLocation = routeCooperative
        ? [routeCooperative.lat, routeCooperative.lng]
        : null;

    const routeCoordinates = useMemo(() => {
        if (!autoRouteEnabled || !userCoords || !routeCooperative) return [];
        const routeStart = [userCoords.lat, userCoords.lng];
        const routeEnd = routeCooperative
            ? [routeCooperative.lat, routeCooperative.lng]
            : null;
        const coordinates = [routeStart];
        (optimizedRoute?.optimizedRoute || []).forEach((id) => {
            const item = items.find((candidate) => candidate.id === id);
            if (item) coordinates.push([item.lat, item.lng]);
        });
        if (routeEnd) coordinates.push(routeEnd);
        return coordinates;
    }, [autoRouteEnabled, optimizedRoute, items, userCoords, routeCooperative]);

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
    }, [routeCoordinates]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 0 }}>
            <MapContainer
                center={defaultCenter}
                zoom={userCoords ? 13 : 4}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false} // Hide default zoom control for cleaner look
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
                {userCoords && (
                    <Marker
                        position={startLocation}
                        icon={iconsCache.userLocation}
                    >
                        <Popup><strong>Você está aqui</strong><br /><small>Posição informada pelo seu dispositivo.</small></Popup>
                    </Marker>
                )}

                {cooperatives.map((cooperative) => (
                    <Marker
                        key={`cooperative-${cooperative.id}`}
                        position={[cooperative.lat, cooperative.lng]}
                        icon={cooperative.location_verified ? iconsCache.coopLocation : iconsCache.approximateCoopLocation}
                    >
                        <Popup>
                            <strong>{cooperative.name}</strong><br />
                            {cooperative.address}<br />
                            {!cooperative.location_verified && <><strong style={{ color: '#b45309' }}>{cooperative.is_coverage_area ? 'Área de referência — não é endereço de entrega.' : 'Localização aproximada — confirme antes de ir.'}</strong><br /></>}
                            <small>{cooperative.price_status}</small><br />
                            {cooperative.source_url && (
                                <a href={cooperative.source_url} target="_blank" rel="noreferrer">Ver fonte do local</a>
                            )}
                        </Popup>
                    </Marker>
                ))}

                {/* Cooperative Marker if optimizedRoute is active */}
                {optimizedRoute && coopLocation && cooperatives.length === 0 && (
                    <Marker
                        position={coopLocation}
                        icon={iconsCache.coopLocation}
                    >
                        <Popup>
                            <strong>Destino de triagem</strong><br />
                            Confirme a associação antes de iniciar a rota.
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
                    cooperatives={cooperatives}
                    routeCoordinates={streetCoordinates.length > 0 ? streetCoordinates : routeCoordinates} 
                />
                <MapController center={controlledCenter} />
            </MapContainer>
        </div>
    );
};

export default Map;
