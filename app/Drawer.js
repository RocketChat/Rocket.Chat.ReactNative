import { Navigation } from 'react-native-navigation';

const DRAWER_ID = 'Sidebar';

class Drawer {
	constructor() {
		this.visible = false;

		Navigation.events().registerComponentDidAppearListener(({ componentId }) => {
			if (componentId === DRAWER_ID) {
				this.visible = true;
			}
		});

		Navigation.events().registerComponentDidDisappearListener(({ componentId }) => {
			if (componentId === DRAWER_ID) {
				this.visible = false;
			}
		});
	}

	toggle() {
		try {
			const visibility = !this.visible;
			Navigation.mergeOptions(DRAWER_ID, {
				sideMenu: {
					left: {
						visible: visibility
					}
				}
			});
			this.visible = visibility;
		} catch (error) {
			console.warn(error);
		}
	}
}

export default new Drawer();
