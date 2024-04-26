import Combine
import CoreData
import SwiftUI

struct ServerListView: View {
	@EnvironmentObject private var router: AppRouter
	
	@Dependency private var serversLoader: ServersLoading
	
	@State private var state: ViewState = .loading
	
	@FetchRequest<Server> private var servers: FetchedResults<Server>
	
	init() {
		let fetchRequest = Server.fetchRequest()
		fetchRequest.sortDescriptors = []
		
		_servers = FetchRequest(fetchRequest: fetchRequest)
	}
	
	@ViewBuilder
	private var serverList: some View {
		List(servers.sort()) { server in
			ServerView(server: server)
				.onTapGesture {
					router.route(to: .roomList(server))
				}
		}
	}
	
	@ViewBuilder
	private var refreshLabel: some View {
		if #available(watchOS 10.0, *) {
			Image(systemName: "gobackward")
		} else {
			Text("Refresh")
		}
	}
	
	var body: some View {
		VStack {
			switch state {
			case .loading:
				ProgressView()
			case .loaded where servers.isEmpty:
				RetryView("No connected workspaces.", action: loadServers)
			case .loaded:
				serverList
			case .error(let error) where error == .locked:
				RetryView("Please unlock your iPhone.", action: loadServers)
			case .error(let error) where error == .unactive:
				RetryView("Could not connect to your iPhone.", action: loadServers)
			case .error(let error) where error == .unreachable:
				RetryView("Could not reach your iPhone.", action: loadServers)
			case .error(let error) where error == .undecodable(error):
				RetryView("Could not read workspaces from iPhone.", action: loadServers)
			default:
				RetryView("Unexpected error.", action: loadServers)
			}
		}
		.navigationTitle {
			Text("Workspaces").foregroundColor(.red)
		}
		.navigationBarTitleDisplayMode(.inline)
		.navigationDestination(for: $router.server) { server in
			LoggedInView(server: server)
				.environmentObject(router)
		}
		.toolbar {
			ToolbarItem(placement: .default) {
				Button {
					loadServers()
				} label: {
					refreshLabel
				}
			}
		}
		.onAppear {
			loadServers()
		}
	}
	
	private func loadServers() {
		state = .loading
		
		serversLoader.loadServers()
			.receive(on: DispatchQueue.main)
			.subscribe(Subscribers.Sink { completion in
				if case .failure(let error) = completion {
					state = .error(error)
				}
			} receiveValue: { _ in
				state = .loaded
			})
	}
}

extension ServerListView {
	enum ViewState {
		case loading
		case loaded
		case error(ServersLoadingError)
	}
}

private extension Collection where Element == Server {
	func sort() -> [Element] {
		sorted { $0.host < $1.host }
	}
}

private extension Server {
	var host: String {
		url.host ?? ""
	}
}
