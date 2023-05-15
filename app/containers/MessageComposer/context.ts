import { createContext } from 'react';

import { TMicOrSend } from './interfaces';

type TMicOrSendContext = {
	micOrSend: TMicOrSend;
	setMicOrSend: (type: TMicOrSend) => void;
};

export const MicOrSendContext = createContext<TMicOrSendContext>({ micOrSend: 'mic', setMicOrSend: () => {} });
