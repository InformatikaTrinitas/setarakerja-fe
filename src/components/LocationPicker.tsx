import React from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type LatLng = { lat: number; lng: number };

const PIN = L.divIcon({
  className: '',
  html: '<span style="display:block;width:20px;height:20px;border-radius:9999px;background:#395886;border:3px solid #ffffff;box-shadow:0 1px 5px rgba(0,0,0,.45)"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const DEFAULT_CENTER: LatLng = { lat: -6.2088, lng: 106.8456 };

function ClickCapture({ onPick }: { onPick: (point: LatLng) => void }) {
  useMapEvents({
    click: (event) => onPick({ lat: Number(event.latlng.lat.toFixed(6)), lng: Number(event.latlng.lng.toFixed(6)) }),
  });
  return null;
}

interface Props {
  /** Titik lokasi (lat, lng) yang sedang aktif. */
  value: LatLng | null;
  /** Wajib pada mode pemilih; diabaikan saat readOnly. */
  onChange?: (point: LatLng) => void;
  /** Peta hanya-lihat (untuk detail lowongan) — klik tidak mengubah titik. */
  readOnly?: boolean;
  /** Tinggi peta dalam px. */
  height?: number;
}

export default function LocationPicker({ value, onChange, readOnly = false, height = 280 }: Props) {
  const center = value ?? DEFAULT_CENTER;

  return (
    <div
      className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100"
      style={{ height }}
    >
      <MapContainer
        key={`${center.lat},${center.lng}`}
        center={[center.lat, center.lng]}
        zoom={value ? 14 : 10}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!readOnly && onChange && <ClickCapture onPick={onChange} />}
        {value && <Marker position={[value.lat, value.lng]} icon={PIN} />}
      </MapContainer>
    </div>
  );
}
