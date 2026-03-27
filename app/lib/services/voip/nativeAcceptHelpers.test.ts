import { getEffectiveNativeAcceptedCallId } from './nativeAcceptHelpers';

describe('getEffectiveNativeAcceptedCallId', () => {
	const base = {
		call: null,
		callId: 'call-1',
		nativeAcceptedCallId: 'call-1'
	};

	it('returns transient callId when set', () => {
		expect(getEffectiveNativeAcceptedCallId(base)).toBe('call-1');
	});

	it('returns sticky id when transient callId was cleared', () => {
		expect(
			getEffectiveNativeAcceptedCallId({
				call: null,
				callId: null,
				nativeAcceptedCallId: 'sticky-1'
			})
		).toBe('sticky-1');
	});

	it('prefers transient callId over sticky when both set', () => {
		expect(
			getEffectiveNativeAcceptedCallId({
				call: null,
				callId: 'transient',
				nativeAcceptedCallId: 'sticky'
			})
		).toBe('transient');
	});

	it('returns null when a call object is bound', () => {
		expect(getEffectiveNativeAcceptedCallId({ ...base, call: {} })).toBeNull();
	});

	it('returns null when no id is set', () => {
		expect(
			getEffectiveNativeAcceptedCallId({
				call: null,
				callId: null,
				nativeAcceptedCallId: null
			})
		).toBeNull();
	});
});
