import { URL } from 'react-native-url-polyfill';

/**
 * Normalizes and validates image URLs for use with expo-image.
 * Ensures URLs are valid HTTP/HTTPS URLs and not file paths to prevent
 * iOS crashes when expo-image's native code incorrectly uses URL(fileURLWithPath:)
 * for HTTP URLs.
 *
 * @param url - The URL string to normalize
 * @returns Normalized HTTP/HTTPS URL string or null if invalid
 */
export const normalizeImageUrl = (url: string | null | undefined): string | null => {
	if (!url || typeof url !== 'string') {
		return null;
	}

	// Trim whitespace
	const trimmedUrl = url.trim();

	if (!trimmedUrl) {
		return null;
	}

	// Reject file:// URLs - these should be handled separately
	if (trimmedUrl.startsWith('file://')) {
		return null;
	}

	// Reject data: URLs - these are handled differently by expo-image
	if (trimmedUrl.startsWith('data:')) {
		return null;
	}

	try {
		// Try to parse as URL to validate
		const urlObj = new URL(trimmedUrl);

		// Only allow http and https protocols
		if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
			return null;
		}

		// Return the normalized URL string
		// This ensures proper encoding and formatting
		return urlObj.toString();
	} catch (error) {
		// If URL parsing fails, try to fix common issues
		// Check if it's a relative URL that needs a protocol
		if (trimmedUrl.startsWith('//')) {
			// Protocol-relative URL - add https
			try {
				const urlObj = new URL(`https:${trimmedUrl}`);
				return urlObj.toString();
			} catch {
				return null;
			}
		}

		// If it starts with http but parsing failed, it might be malformed
		// Return null to prevent crashes
		if (trimmedUrl.toLowerCase().startsWith('http')) {
			return null;
		}

		// Not a valid URL
		return null;
	}
};
