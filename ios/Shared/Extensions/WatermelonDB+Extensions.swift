import WatermelonDB

extension WatermelonDB.Database {
	convenience init(name: String) {
		let isOfficial = Bundle.main.bool(forKey: "IS_OFFICIAL")
		let groupDir = FileManager.default.groupDir()
		let path = "\(groupDir)/\(name)\(isOfficial ? "" : "-experimental").db"
		
		self.init(path: path)
	}
	
	func query<T: Codable>(raw: SQL, _ args: QueryArgs = []) -> [T] {
		guard let results = try? queryRaw(raw, args) else {
			return []
		}
		
		return results.compactMap { result in
			guard let dictionary = result.resultDictionary else {
				return nil
			}
			
			guard let data = try? JSONSerialization.data(withJSONObject: dictionary) else {
				return nil
			}
			
			guard let item = try? JSONDecoder().decode(T.self, from: data) else {
				return nil
			}
			
			return item
		}
	}
}
