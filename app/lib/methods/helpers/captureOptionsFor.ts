export type VideoQuality = 'auto' | 'h1080' | 'h720' | 'h360' | 'h180';

export type CaptureResolution = { width: number; height: number; frameRate: number; aspectRatio: number };

export type QualityCaptureOptions = { resolution?: CaptureResolution };

export const VIDEO_QUALITY_ORDER: readonly VideoQuality[] = ['auto', 'h1080', 'h720', 'h360', 'h180'];

const resolutionOf = (width: number, height: number, frameRate: number): CaptureResolution => ({
	width,
	height,
	frameRate,
	aspectRatio: width / height
});

const PRESETS: Record<Exclude<VideoQuality, 'auto'>, QualityCaptureOptions> = {
	h1080: { resolution: resolutionOf(1920, 1080, 30) },
	h720: { resolution: resolutionOf(1280, 720, 30) },
	h360: { resolution: resolutionOf(640, 360, 20) },
	h180: { resolution: resolutionOf(320, 180, 20) }
};

export const captureOptionsFor = (quality: VideoQuality): QualityCaptureOptions => (quality === 'auto' ? {} : PRESETS[quality]);
