export class NavigationControllerManager {
	static getSharedInstance() {
		if (NavigationControllerManager.instance == null) {
			NavigationControllerManager.instance = new NavigationControllerManager();
		}

		return NavigationControllerManager.instance;
	}

	static instance = null;

	activeRootComponent = {};

	getActiveRootComponent() {
		return this.activeRootComponent;
	}

	setActiveRootComponentId(componentId, componentName) {
		if (componentId) {
			this.activeRootComponent.componentId = componentId;
		}
		this.activeRootComponent.componentName = componentName;
	}
}