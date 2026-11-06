import { isAgentParticipant } from '../isAgentParticipant';

describe('isAgentParticipant', () => {
	it('trusts the SDK flag', () => {
		expect(isAgentParticipant({ identity: 'pi4DkEKp2haGrn33c', isAgent: true })).toBe(true);
	});

	it('recognises an agent by its identity when the flag arrives late', () => {
		expect(isAgentParticipant({ identity: 'agent-AJ_9fK2xLm' })).toBe(true);
		expect(isAgentParticipant({ identity: 'agent_helper' })).toBe(true);
		expect(isAgentParticipant({ identity: 'AJ_9fK2xLm' })).toBe(true);
	});

	it('keeps people in, including ids that merely contain agent or AJ_', () => {
		expect(isAgentParticipant({ identity: 'pi4DkEKp2haGrn33c' })).toBe(false);
		expect(isAgentParticipant({ identity: 'secret-agent-007' })).toBe(false);
		expect(isAgentParticipant({ identity: 'AJ_not valid' })).toBe(false);
	});
});
