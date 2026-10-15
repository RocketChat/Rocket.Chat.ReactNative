const KBPS_PER_MBPS = 1000;

export const formatBitrate = (kbps?: number): string => {
	if (kbps === undefined) {
		return '—';
	}
	return kbps >= KBPS_PER_MBPS ? `${(kbps / KBPS_PER_MBPS).toFixed(1)} Mbps` : `${Math.round(kbps)} kbps`;
};
