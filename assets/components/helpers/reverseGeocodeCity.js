const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const REQUEST_TIMEOUT_MS = 8000;

/**
 * Return the most specific city-like locality Nominatim provides.
 * We intentionally do not substitute a state/county: those would broaden the
 * search beyond the client’s actual city.
 */
export const extractCityFromReverseGeocode = (result) => {
    const address = result?.address || {};
    const locality = [address.city, address.town, address.village, address.municipality]
        .find(value => typeof value === 'string' && value.trim());

    return locality ? locality.trim() : '';
};

/**
 * Resolve a saved map point to a city using OpenStreetMap Nominatim.
 * Returns an empty string when coordinates are invalid, the request fails, or
 * the reverse-geocoder cannot identify a city; callers can then apply their
 * chosen fallback behavior.
 */
export const reverseGeocodeCity = async (latitude, longitude) => {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || lat < -90 || lat > 90 ||
        !Number.isFinite(lng) || lng < -180 || lng > 180) {
        return '';
    }

    const query = [
        `format=jsonv2`,
        `lat=${encodeURIComponent(String(lat))}`,
        `lon=${encodeURIComponent(String(lng))}`,
        'zoom=10',
        'addressdetails=1',
        'accept-language=en'
    ].join('&');
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller
        ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
        : null;

    try {
        const response = await fetch(`${NOMINATIM_REVERSE_URL}?${query}`, {
            headers: {
                Accept: 'application/json',
                'Accept-Language': 'en',
                'User-Agent': 'MaidAndServantOnline/1.0'
            },
            ...(controller ? { signal: controller.signal } : {})
        });

        if (!response.ok) return '';
        return extractCityFromReverseGeocode(await response.json());
    } catch (error) {
        return '';
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
};
