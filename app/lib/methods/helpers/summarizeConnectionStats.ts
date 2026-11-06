const MS_PER_SECOND = 1000;
const BITS_PER_BYTE = 8;

export type TStatsSample = { at: number; bytesSent: number; bytesReceived: number };

export type TSenderStat = { bytesSent?: number; roundTripTime?: number };

export type TVideoSenderStat = TSenderStat & {
	frameWidth: number;
	frameHeight: number;
	framesPerSecond: number;
	qualityLimitationReason?: string;
};

export type TReceiverStat = { bytesReceived?: number };

export type TConnectionSummary = {
	sample: TStatsSample;
	roundTripTimeMs?: number;
	uploadKbps?: number;
	downloadKbps?: number;
	sendWidth?: number;
	sendHeight?: number;
	sendFps?: number;
	limitedBy?: string;
};

type TSummarizeParams = {
	audioSenders: TSenderStat[];
	videoSenders: TVideoSenderStat[];
	receivers: TReceiverStat[];
	previous?: TStatsSample;
	now: number;
};

const sum = (values: (number | undefined)[]): number => values.reduce<number>((total, value) => total + (value ?? 0), 0);

const kbpsBetween = (previousBytes: number, bytes: number, elapsedMs: number): number | undefined =>
	elapsedMs > 0 ? (Math.max(0, bytes - previousBytes) * BITS_PER_BYTE) / elapsedMs : undefined;

export const summarizeConnectionStats = ({
	audioSenders,
	videoSenders,
	receivers,
	previous,
	now
}: TSummarizeParams): TConnectionSummary => {
	const senders = [...audioSenders, ...videoSenders];
	const sample: TStatsSample = {
		at: now,
		bytesSent: sum(senders.map(({ bytesSent }) => bytesSent)),
		bytesReceived: sum(receivers.map(({ bytesReceived }) => bytesReceived))
	};
	const roundTrips = senders.flatMap(({ roundTripTime }) => (roundTripTime === undefined ? [] : [roundTripTime]));
	const elapsedMs = previous ? now - previous.at : 0;
	const activeLayer = videoSenders
		.filter(({ framesPerSecond }) => framesPerSecond > 0)
		.reduce<TVideoSenderStat | undefined>(
			(best, layer) => (!best || layer.frameWidth > best.frameWidth ? layer : best),
			undefined
		);

	return {
		sample,
		roundTripTimeMs: roundTrips.length ? Math.round(Math.max(...roundTrips) * MS_PER_SECOND) : undefined,
		uploadKbps: previous ? kbpsBetween(previous.bytesSent, sample.bytesSent, elapsedMs) : undefined,
		downloadKbps: previous ? kbpsBetween(previous.bytesReceived, sample.bytesReceived, elapsedMs) : undefined,
		sendWidth: activeLayer?.frameWidth,
		sendHeight: activeLayer?.frameHeight,
		sendFps: activeLayer ? Math.round(activeLayer.framesPerSecond) : undefined,
		limitedBy:
			activeLayer?.qualityLimitationReason && activeLayer.qualityLimitationReason !== 'none'
				? activeLayer.qualityLimitationReason
				: undefined
	};
};
