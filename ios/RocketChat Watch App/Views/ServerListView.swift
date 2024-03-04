import Combine
import CoreData
import SwiftUI

struct ServerListView: View {
	@Dependency private var router: AppRouting
	@Dependency private var serversLoader: ServersLoading
	
	@State private var state: ViewState = .loading
	
	@FetchRequest<Server> private var servers: FetchedResults<Server>
	
	@Environment(\.scenePhase) private var scenePhase
	
	init() {
		let fetchRequest = Server.fetchRequest()
		fetchRequest.sortDescriptors = []
		
		_servers = FetchRequest(fetchRequest: fetchRequest)
	}
	
	@ViewBuilder
	private var serverList: some View {
		List {
			ForEach(servers.sort()) { server in
				ServerView(server: server)
					.onTapGesture {
						router.route(to: .roomList(server))
					}
			}
		}
		.toolbar {
			ToolbarItem(placement: .automatic) {
				Button("Refresh") {
					loadServers()
				}
			}
		}
	}
	
	var body: some View {
		VStack {
			switch state {
			case .loading:
				ProgressView()
			case .loaded where servers.isEmpty:
				RetryView("No Connected servers.", action: loadServers)
			case .loaded:
				serverList
			case .error(let error) where error == .locked:
				RetryView("Please unlock your iPhone.", action: loadServers)
			case .error(let error) where error == .unactive:
				RetryView("Could not connect to your iPhone.", action: loadServers)
			case .error(let error) where error == .unreachable:
				RetryView("Could not reach your iPhone.", action: loadServers)
			case .error(let error) where error == .undecodable(error):
				RetryView("Could not read servers from iPhone.", action: loadServers)
			default:
				RetryView("Unexpected error.", action: loadServers)
			}
		}
		.navigationTitle("Servers")
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
