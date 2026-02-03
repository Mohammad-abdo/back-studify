/**
 * OSRM Service – تتبع الطلبات والدليفري باستخدام OpenStreetMap (OSRM)
 * يحسب المسافة على الطريق والوقت التقديري للوصول.
 */

const OSRM_BASE = 'https://router.project-osrm.org';

/**
 * Get route distance and duration between points using OSRM (OpenStreetMap).
 * @param {Array<{ lat: number, lng: number }>} points - نقاط المسار (أول نقطة = الدليفري، آخر نقطة = وجهة الطلب)
 * @returns {Promise<{ distanceMeters: number, durationSeconds: number } | null>}
 */
async function getRouteDistanceAndDuration(points) {
  if (!points || points.length < 2) return null;

  // OSRM expects: lng,lat;lng,lat;...
  const coords = points.map((p) => `${Number(p.lng)},${Number(p.lat)}`).join(';');
  const url = `${OSRM_BASE}/route/v1/driving/${coords}?overview=false`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.code !== 'Ok' || !data.routes?.[0]) return null;

    const route = data.routes[0];
    return {
      distanceMeters: Math.round(route.distance * 10) / 10,
      durationSeconds: Math.round(route.duration),
    };
  } catch (err) {
    console.warn('OSRM request failed:', err.message);
    return null;
  }
}

/**
 * Get route between two points (from = delivery, to = order destination).
 * @param {number} fromLat
 * @param {number} fromLng
 * @param {number} toLat
 * @param {number} toLng
 */
async function getRouteFromTo(fromLat, fromLng, toLat, toLng) {
  return getRouteDistanceAndDuration([
    { lat: fromLat, lng: fromLng },
    { lat: toLat, lng: toLng },
  ]);
}

module.exports = {
  getRouteDistanceAndDuration,
  getRouteFromTo,
};
