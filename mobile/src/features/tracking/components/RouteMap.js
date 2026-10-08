// Route map (Member 02, FR-02): the stops of a route, the line between them and the bus on it.
// Drawn with Leaflet over OpenStreetMap tiles inside a WebView, because Google Maps on Android needs
// an API key compiled into the app and this project ships no key. The admin dashboard draws the same
// map the same way, so what a driver sees and what the office sees cannot drift apart.
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, radii, sizes, spacing, typography } from '../../../theme';
import { COLOMBO_CENTRE, MAP_MESSAGES } from '../constants';

/** Leaflet and the tiles both come over the network, which the map needs in any case. */
const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
/** Required by the OpenStreetMap tile policy; Leaflet prints it in the corner. */
const OSM_ATTRIBUTION = '&copy; OpenStreetMap contributors';
const DEFAULT_ZOOM = 12;
const MAX_TILE_ZOOM = 19;
/** Stops the first fit from diving to street level when only one point is known. */
const MAX_FITTED_ZOOM = 15;
const MAP_READY_MESSAGE = 'map-ready';
const MAP_FAILED_MESSAGE = 'map-failed';

/**
 * The page the WebView runs. It is built once: afterwards the screen only pushes new positions into
 * it, so a moving bus never reloads the map.
 * @returns {string} The HTML document.
 */
function buildMapDocument() {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <link rel="stylesheet" href="${LEAFLET_CSS_URL}" />
    <script src="${LEAFLET_JS_URL}"></script>
    <style>
      html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
      body { background: ${colors.background}; }
      .bus-marker {
        width: 26px;
        height: 26px;
        border-radius: 13px;
        background: ${colors.primary[500]};
        border: 3px solid ${colors.text.onColor};
        box-shadow: 0 1px 4px rgba(15, 23, 42, 0.45);
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      function tellTheApp(message) {
        // The bridge is injected before this script runs, but a guard costs nothing and a thrown
        // error here would leave the app waiting for a map that never says it is ready.
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(message);
      }

      // Leaflet comes from the network. Without it there is no map, and the app needs to hear that
      // so it can show the "could not load" line instead of an empty white box.
      if (typeof L === 'undefined') {
        tellTheApp('${MAP_FAILED_MESSAGE}');
      } else {
      var map = L.map('map').setView([${COLOMBO_CENTRE.latitude}, ${COLOMBO_CENTRE.longitude}], ${DEFAULT_ZOOM});
      L.tileLayer('${OSM_TILE_URL}', { maxZoom: ${MAX_TILE_ZOOM}, attribution: '${OSM_ATTRIBUTION}' }).addTo(map);
      var drawnLayer = L.layerGroup().addTo(map);
      // The view is fitted to the route once; after that the rider's own panning is left alone.
      var hasFittedOnce = false;

      function buildTooltip(tooltipText) {
        var tooltipElement = document.createElement('span');
        tooltipElement.textContent = tooltipText;
        return tooltipElement;
      }

      // Leaflet measures its container once, at creation. In a WebView the view is often still
      // settling at that moment, so without this the map tiles only part of the screen.
      window.addEventListener('resize', function () { map.invalidateSize(); });
      window.addEventListener('load', function () { map.invalidateSize(); });

      window.drawRoute = function (payload) {
        map.invalidateSize();
        drawnLayer.clearLayers();
        var plottedPoints = [];

        if (payload.stops.length > 1) {
          L.polyline(
            payload.stops.map(function (routeStop) { return [routeStop.latitude, routeStop.longitude]; }),
            { color: '${colors.primary[500]}', weight: 5, opacity: 0.8 }
          ).addTo(drawnLayer);
        }

        payload.stops.forEach(function (routeStop) {
          var isCurrentStop = routeStop.id === payload.currentStopId;
          L.circleMarker([routeStop.latitude, routeStop.longitude], {
            radius: isCurrentStop ? 8 : 5,
            weight: 2,
            color: isCurrentStop ? '${colors.secondary[500]}' : '${colors.primary[600]}',
            fillColor: isCurrentStop ? '${colors.secondary[500]}' : '${colors.surface}',
            fillOpacity: 1
          })
            .bindTooltip(buildTooltip(routeStop.stopName))
            .addTo(drawnLayer);
          plottedPoints.push([routeStop.latitude, routeStop.longitude]);
        });

        if (payload.bus) {
          L.marker([payload.bus.latitude, payload.bus.longitude], {
            icon: L.divIcon({
              className: '',
              html: '<div class="bus-marker"></div>',
              iconSize: [26, 26],
              iconAnchor: [13, 13]
            })
          })
            .bindTooltip(buildTooltip(payload.busLabel))
            .addTo(drawnLayer);
          plottedPoints.push([payload.bus.latitude, payload.bus.longitude]);
        }

        if (!hasFittedOnce && plottedPoints.length > 0) {
          map.fitBounds(plottedPoints, { padding: [32, 32], maxZoom: ${MAX_FITTED_ZOOM} });
          hasFittedOnce = true;
        }
      };

      tellTheApp('${MAP_READY_MESSAGE}');
      }
    </script>
  </body>
</html>`;
}

/**
 * Map of one route with the bus on it.
 * @param {object} props - Component props.
 * @param {Array<{id: string, latitude: number, longitude: number, stopName: string}>} props.stops -
 *   Route stops in travel order.
 * @param {string} [props.currentStopId] - Stop the bus has most recently reached, drawn larger.
 * @param {{latitude: number, longitude: number} | null} [props.busPosition] - Where the bus is now.
 * @param {string} [props.busLabel] - Wording on the bus marker's tooltip.
 * @param {string} props.accessibilityLabel - What the map shows, for a screen reader.
 * @param {object} [props.style] - Size of the map; it fills whatever it is given.
 * @returns {import('react').JSX.Element} The map.
 */
export default function RouteMap({
  stops,
  currentStopId,
  busPosition = null,
  busLabel = MAP_MESSAGES.busLabel,
  accessibilityLabel,
  style,
}) {
  const webViewRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [hasMapFailed, setHasMapFailed] = useState(false);

  const mapDocument = useMemo(() => buildMapDocument(), []);
  const drawPayload = useMemo(
    () =>
      JSON.stringify({
        stops: stops.map((routeStop) => ({
          id: String(routeStop.id),
          latitude: routeStop.latitude,
          longitude: routeStop.longitude,
          stopName: routeStop.stopName,
        })),
        currentStopId: currentStopId ? String(currentStopId) : null,
        bus: busPosition,
        busLabel,
      }),
    [stops, currentStopId, busPosition, busLabel]
  );

  useEffect(() => {
    if (!isMapReady || !webViewRef.current) return;
    // Pushing the new positions in beats reloading the page: the map keeps its zoom and the tiles
    // already fetched, and the bus marker simply moves.
    webViewRef.current.injectJavaScript(`window.drawRoute(${drawPayload}); true;`);
  }, [isMapReady, drawPayload]);

  if (hasMapFailed) {
    return (
      <View style={[style, styles.fallback]}>
        <Text style={[typography.bodyMedium, styles.fallbackText]}>{MAP_MESSAGES.mapFailed}</Text>
      </View>
    );
  }

  return (
    <WebView
      ref={webViewRef}
      style={style}
      source={{ html: mapDocument }}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      // The driver screen scrolls, so the map has to be allowed to take its own drag gestures.
      nestedScrollEnabled
      onMessage={(messageEvent) => {
        if (messageEvent.nativeEvent.data === MAP_READY_MESSAGE) setIsMapReady(true);
        if (messageEvent.nativeEvent.data === MAP_FAILED_MESSAGE) setHasMapFailed(true);
      }}
      onError={() => setHasMapFailed(true)}
      onHttpError={() => setHasMapFailed(true)}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: sizes.borderThin,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  fallbackText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
