//
//  ShareRocketChatRN.swift
//  ShareRocketChatRN
//
//  Created by Diego Mello on 8/15/24.
//  Copyright © 2024 Facebook. All rights reserved.
//

import UIKit
import MobileCoreServices

class ShareRocketChatRN: UIViewController {
    let appScheme = "rocketchat"

    private func shareExtensionURL(params: [String: String]) -> URL? {
        var components = URLComponents()
        components.scheme = appScheme
        components.host = "shareextension"
        components.queryItems = params.map { URLQueryItem(name: $0.key, value: $0.value) }
        // URLComponents leaves "+" unescaped, and the JS query parser reads it as a space.
        components.percentEncodedQuery = components.percentEncodedQuery?.replacingOccurrences(of: "+", with: "%2B")
        return components.url
    }

    private func sanitizeFileName(_ name: String) -> String {
        var base = (name as NSString).lastPathComponent.trimmingCharacters(in: .whitespacesAndNewlines)
        base = base.replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "\\", with: "_")
        return base.isEmpty || base == "." || base == ".." ? UUID().uuidString : base
    }

    private func uniqueFileURL(in groupURL: URL, filename: String) -> URL {
        var dest = groupURL.appendingPathComponent(sanitizeFileName(filename))
        while FileManager.default.fileExists(atPath: dest.path) {
            dest = groupURL.appendingPathComponent("\(UUID().uuidString)-\(sanitizeFileName(filename))")
        }
        return dest
    }

    private func copyFileToSharedContainer(fileUrl: URL, filename: String) -> URL? {
        guard let appGroup = Bundle.main.object(forInfoDictionaryKey: "AppGroupIdentifier") as? String,
              let groupURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup) else {
            return nil
        }
        let needsScoped = fileUrl.startAccessingSecurityScopedResource()
        defer { if needsScoped { fileUrl.stopAccessingSecurityScopedResource() } }
        do {
            let dest = uniqueFileURL(in: groupURL, filename: filename.isEmpty ? fileUrl.lastPathComponent : filename)
            try FileManager.default.copyItem(at: fileUrl, to: dest)
            return dest
        } catch {
            return nil
        }
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)

        // Hosts may split one share across several input items and attachments (Firefox sends the
        // page URL and its title separately), so every attachment is considered.
        let attachments = (extensionContext?.inputItems ?? [])
            .compactMap { ($0 as? NSExtensionItem)?.attachments }
            .flatMap { $0 }

        if attachments.isEmpty {
            self.completeRequest()
            return
        }

        let isUrlOrText = { (item: NSItemProvider) in
            item.hasItemConformingToTypeIdentifier("public.url") || item.hasItemConformingToTypeIdentifier("public.text")
        }
        if attachments.allSatisfy(isUrlOrText) {
            self.handleUrlsAndText(items: attachments)
            return
        }

        // Handle Media (Images, Videos) and Data (PDFs, etc.) for all attachments
        self.handleMultipleMediaAndData(items: attachments)
    }

    private enum SharedContent {
        case webUrl(String)
        case fileUrl
        case text(String)
    }

    private func loadUrlOrText(item: NSItemProvider, completion: @escaping (SharedContent?) -> Void) {
        if item.hasItemConformingToTypeIdentifier("public.url") {
            item.loadItem(forTypeIdentifier: "public.url", options: nil) { (data, error) in
                guard let url = data as? URL else {
                    completion(nil)
                    return
                }
                completion(url.isFileURL ? .fileUrl : .webUrl(url.absoluteString))
            }
            return
        }
        item.loadItem(forTypeIdentifier: "public.text", options: nil) { (data, error) in
            if let text = data as? String {
                completion(.text(text))
            } else if let text = data as? NSAttributedString {
                completion(.text(text.string))
            } else if let data = data as? Data, let text = String(data: data, encoding: .utf8) {
                completion(.text(text))
            } else {
                completion(nil)
            }
        }
    }

    private func handleUrlsAndText(items: [NSItemProvider]) {
        var contents = [SharedContent?](repeating: nil, count: items.count)
        let lock = NSLock()
        let dispatchGroup = DispatchGroup()

        for (index, item) in items.enumerated() {
            dispatchGroup.enter()
            self.loadUrlOrText(item: item) { content in
                lock.lock()
                contents[index] = content
                lock.unlock()
                dispatchGroup.leave()
            }
        }

        dispatchGroup.notify(queue: .main) {
            if contents.contains(where: { if case .fileUrl = $0 { return true } else { return false } }) {
                self.handleAllFileURLs(items: items)
                return
            }

            // A web URL wins over any text, so a page shares as its link only, as in Safari.
            let webUrl = contents.lazy.compactMap { content -> String? in
                if case .webUrl(let url) = content { return url } else { return nil }
            }.first
            let text = contents.lazy.compactMap { content -> String? in
                if case .text(let text) = content { return text } else { return nil }
            }.first
            let message = webUrl ?? text ?? ""

            if !message.isEmpty, let url = self.shareExtensionURL(params: ["text": message]) {
                _ = self.openURL(url)
            }
            self.completeRequest()
        }
    }

    private func handleAllFileURLs(items: [NSItemProvider]) {
        var fileUris = [String]()
        let lock = NSLock()
        let dispatchGroup = DispatchGroup()

        for item in items {
            dispatchGroup.enter()
            item.loadItem(forTypeIdentifier: "public.data", options: nil) { (data, error) in
                if let fileUrl = data as? URL, fileUrl.isFileURL {
                    if let savedUrl = self.copyFileToSharedContainer(fileUrl: fileUrl, filename: fileUrl.lastPathComponent) {
                        lock.lock()
                        fileUris.append(savedUrl.absoluteString)
                        lock.unlock()
                    }
                }
                dispatchGroup.leave()
            }
        }

        dispatchGroup.notify(queue: .main) {
            if !fileUris.isEmpty, let url = self.shareExtensionURL(params: ["mediaUris": fileUris.joined(separator: ",")]) {
                _ = self.openURL(url)
            }
            self.completeRequest()
        }
    }


    private func handleMultipleMediaAndData(items: [NSItemProvider]) {
        var mediaUris = [String]()
        let lock = NSLock()
        let dispatchGroup = DispatchGroup()

        for (_, item) in items.enumerated() {
            dispatchGroup.enter()

            if item.hasItemConformingToTypeIdentifier("public.image") {
                self.loadAndSaveItem(item: item, type: "public.image", dispatchGroup: dispatchGroup) { mediaUriInfo in
                    if let mediaUriInfo = mediaUriInfo {
                        lock.lock()
                        mediaUris.append(mediaUriInfo)
                        lock.unlock()
                    }
                }
            } else if item.hasItemConformingToTypeIdentifier("public.movie") {
                self.loadAndSaveItem(item: item, type: "public.movie", dispatchGroup: dispatchGroup) { mediaUriInfo in
                    if let mediaUriInfo = mediaUriInfo {
                        lock.lock()
                        mediaUris.append(mediaUriInfo)
                        lock.unlock()
                    }
                }
            } else if item.hasItemConformingToTypeIdentifier("public.data") {
                self.loadAndSaveItem(item: item, type: "public.data", dispatchGroup: dispatchGroup) { mediaUriInfo in
                    if let mediaUriInfo = mediaUriInfo {
                        lock.lock()
                        mediaUris.append(mediaUriInfo)
                        lock.unlock()
                    }
                }
            } else {
                dispatchGroup.leave()
            }
        }

        dispatchGroup.notify(queue: .main) {
            if !mediaUris.isEmpty, let url = self.shareExtensionURL(params: ["mediaUris": mediaUris.joined(separator: ",")]) {
                _ = self.openURL(url)
            }
            self.completeRequest()
        }
    }

    private func loadAndSaveItem(item: NSItemProvider, type: String, dispatchGroup: DispatchGroup, completion: @escaping (String?) -> Void) {
        item.loadItem(forTypeIdentifier: type, options: nil) { (data, error) in
            var mediaUriInfo: String?

            if let dataUri = data as? URL {
                if dataUri.isFileURL {
                    mediaUriInfo = self.copyFileToSharedContainer(fileUrl: dataUri, filename: dataUri.lastPathComponent)?.absoluteString
                } else if let data = try? Data(contentsOf: dataUri) {
                    if let fileExtension = self.inferFileExtension(from: item) {
                        let filename = UUID().uuidString + "." + fileExtension
                        mediaUriInfo = self.saveDataToSharedContainer(data: data, filename: filename)?.absoluteString
                    }
                }
            } else if let data = data as? Data {
                if let fileExtension = self.inferFileExtension(from: item) {
                    let filename = UUID().uuidString + "." + fileExtension
                    let savedUrl = self.saveDataToSharedContainer(data: data, filename: filename)
                    mediaUriInfo = savedUrl?.absoluteString
                }
            } else if let image = data as? UIImage {
                if let imageData = image.pngData() {
                    let filename = UUID().uuidString + ".png"
                    let savedUrl = self.saveDataToSharedContainer(data: imageData, filename: filename)
                    mediaUriInfo = savedUrl?.absoluteString
                }
            }

            completion(mediaUriInfo)
            dispatchGroup.leave()
        }
    }

    private func saveDataToSharedContainer(data: Data, filename: String) -> URL? {
        guard let appGroup = Bundle.main.object(forInfoDictionaryKey: "AppGroupIdentifier") as? String else {
            return nil
        }
        guard let groupURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup) else {
            return nil
        }
        let fileURL = uniqueFileURL(in: groupURL, filename: filename)
        do {
            try data.write(to: fileURL)
            return fileURL
        } catch {
            return nil
        }
    }

    private func inferFileExtension(from item: NSItemProvider) -> String? {
        if item.hasItemConformingToTypeIdentifier(kUTTypeImage as String) {
            return "jpeg"
        } else if item.hasItemConformingToTypeIdentifier(kUTTypeMovie as String) {
            return "mp4"
        } else if let typeIdentifier = item.registeredTypeIdentifiers.first as CFString? {
            if let utType = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, typeIdentifier, nil)?.takeRetainedValue() {
                if let preferredExtension = UTTypeCopyPreferredTagWithClass(utType, kUTTagClassFilenameExtension)?.takeRetainedValue() {
                    return preferredExtension as String
                }
            }
        }
        return nil
    }

    @objc private func openURL(_ url: URL) -> Bool {
        var responder: UIResponder? = self
        while responder != nil {
            if let application = responder as? UIApplication {
                application.open(url, options: [:], completionHandler: nil)
                return true
            }
            responder = responder?.next
        }
        return false
    }

    private func completeRequest() {
        self.extensionContext?.completeRequest(returningItems: nil)
    }
}
