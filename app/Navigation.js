class NavigationActionsClass {
	setNavigator(navigator) {
		this.navigator = navigator;
	}

	push = params => this.navigator && this.navigator.push(params);
	pop = params => this.navigator && this.navigator.pop(params);
	popToRoot = params => this.navigator && this.navigator.popToRoot(params);
	resetTo = params => this.navigator && this.navigator.resetTo(params);
	toggleDrawer = params => this.navigator && this.navigator.toggleDrawer(params);
}

export const NavigationActions = new NavigationActionsClass();
