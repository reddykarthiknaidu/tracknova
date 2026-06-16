import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';
import type { Stop } from '@workspace/api-client-react';

interface VehiclePin {
  id: string;
  routeId: number;
  lat: number;
  lng: number;
  speed: number;
  direction: number;
  occupancy: 'low' | 'medium' | 'high';
  lastUpdated: string;
  routeColor?: string;
  nextStop?: string;
}

interface RoutePolyline {
  color?: string | null;
  stops: Stop[];
}

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  vehicles?: VehiclePin[];
  stops?: Stop[];
  route?: RoutePolyline;
  className?: string;
}

const CHENNAI_CENTER: [number, number] = [13.0827, 80.2707];

const getOccupancyColor = (occupancy: VehiclePin['occupancy']) => {
  switch (occupancy) {
    case 'low':    return '#22c55e';
    case 'medium': return '#eab308';
    case 'high':   return '#ef4444';
    default:       return '#3b82f6';
  }
};

export default function MapView({
  center = CHENNAI_CENTER,
  zoom = 12,
  vehicles = [],
  stops = [],
  route,
  className = 'h-[500px] w-full rounded-xl overflow-hidden border border-border',
}: MapViewProps) {
  const routePoints = route?.stops?.map((s) => [s.lat, s.lng] as [number, number]);

  return (
    <div className={className} data-testid="map-container">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', zIndex: 10 }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {routePoints && routePoints.length > 0 && (
          <Polyline
            positions={routePoints}
            color={route?.color ?? '#f97316'}
            weight={4}
            opacity={0.8}
          />
        )}

        {stops.map((stop) => (
          <CircleMarker
            key={stop.id}
            center={[stop.lat, stop.lng]}
            radius={4}
            fillColor="#18181b"
            color="#ffffff"
            weight={1.5}
            fillOpacity={1}
          >
            <Popup>
              <div className="font-semibold">{stop.name}</div>
              <div className="text-xs text-muted-foreground capitalize">{stop.type} Stop</div>
            </Popup>
          </CircleMarker>
        ))}

        {vehicles.map((vehicle) => (
          <CircleMarker
            key={vehicle.id}
            center={[vehicle.lat, vehicle.lng]}
            radius={9}
            fillColor={vehicle.routeColor ?? getOccupancyColor(vehicle.occupancy)}
            color="#ffffff"
            weight={2}
            fillOpacity={0.92}
          >
            <Popup>
              <div className="flex flex-col gap-1 min-w-[140px]">
                <div className="font-bold text-sm">{vehicle.id}</div>
                {vehicle.nextStop && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Next stop: </span>
                    {vehicle.nextStop}
                  </div>
                )}
                <div className="text-xs">Speed: {vehicle.speed} km/h</div>
                <div className="text-xs capitalize">
                  Occupancy:{' '}
                  <span
                    style={{
                      color:
                        vehicle.occupancy === 'low'
                          ? '#16a34a'
                          : vehicle.occupancy === 'medium'
                          ? '#ca8a04'
                          : '#dc2626',
                    }}
                  >
                    {vehicle.occupancy}
                  </span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
