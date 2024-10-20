import React from 'react';
import notifee, { EventType } from '@notifee/react-native';

class RemoteNotifeeHandlersComponent extends React.Component {
	private unsubNotifeeForegroundEvent: () => void | undefined;

	componentDidMount() {
		this.unsubNotifeeForegroundEvent = notifee.onForegroundEvent(({ type, detail }) => {
			switch (type) {
				case EventType.DISMISSED:
					console.log('User dismissed notification', detail.notification);
					break;
				case EventType.PRESS:
					console.log('Notification pressed, but no action taken');
					break;
			}
		});
	}

	componentWillUnmount() {
		if (this.unsubNotifeeForegroundEvent) {
			this.unsubNotifeeForegroundEvent();
		}
	}

	render() {
		// This component doesn't render anything
		return null;
	}
}

export default RemoteNotifeeHandlersComponent;
