import { voipDebugLog } from './voipDebugLog';

const TAG = 'DDP';
const MAX_FRAME_LENGTH = 1500;

function truncate(text: string): string {
	return text.length > MAX_FRAME_LENGTH ? `${text.slice(0, MAX_FRAME_LENGTH)}… [${text.length} chars]` : text;
}

function isRelevantFrame(text: string): boolean {
	return (
		text.includes('media-signal') ||
		text.includes('media-calls') ||
		text.includes('"msg":"ready"') ||
		text.includes('"msg":"nosub"') ||
		text.includes('"msg":"connected"') ||
		text.includes('"msg":"connect"')
	);
}

function toText(args: unknown[]): string {
	return args.map(arg => (typeof arg === 'string' ? arg : arg instanceof Error ? arg.message : JSON.stringify(arg))).join(' ');
}

export const voipDdpLogger = {
	debug: (...args: unknown[]) => {
		const text = toText(args);
		if (isRelevantFrame(text)) {
			voipDebugLog(TAG, truncate(text), undefined, 'debug');
		}
	},
	info: (...args: unknown[]) => {
		const text = toText(args);
		if (text.includes('Login with')) {
			return;
		}
		voipDebugLog(TAG, text);
	},
	warning: (...args: unknown[]) => voipDebugLog(TAG, toText(args), undefined, 'warn'),
	warn: (...args: unknown[]) => voipDebugLog(TAG, toText(args), undefined, 'warn'),
	error: (...args: unknown[]) => voipDebugLog(TAG, toText(args), undefined, 'error')
};
