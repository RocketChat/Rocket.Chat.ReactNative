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
    // ponytail: 32k cap ported from ShareActivity.kt, else openURL/decode blows up
    let maxTextLength = 32000

    private func shareExtensionURL(params: [String: String]) -> URL? {
        var components = URLComponents()
        components.scheme = appScheme
        components.host = "shareextension"
        components.queryItems = params.map { URLQueryItem(name: $0.key, value: $0.value) }
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

    // ponytail: copy, don't Data(contentsOf:) — extension limit ~120MB is RAM, not file size
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

        guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem,
              let attachments = extensionItem.attachments else {
            self.completeRequest()
            return
        }

        // Handle URL or Text using the first attachment only
        if let firstAttachment = attachments.first {
            if firstAttachment.hasItemConformingToTypeIdentifier("public.url") {
                firstAttachment.loadItem(forTypeIdentifier: "public.url", options: nil) { (data, error) in
                    if let url = data as? URL {
                        if url.isFileURL {
                            // Handle all file URLs
                            self.handleAllFileURLs(items: attachments)
                        } else {
                            // Handle as a web URL
                            self.handleUrl(item: firstAttachment)
                        }
                    }
                }
                return
            } else if firstAttachment.hasItemConformingToTypeIdentifier("public.text") {
                self.handleText(item: firstAttachment)
                return
            }
        }

        // Handle Media (Images, Videos) and Data (PDFs, etc.) for all attachments
        self.handleMultipleMediaAndData(items: attachments)
    }

    private func handleText(item: NSItemProvider) {
        item.loadItem(forTypeIdentifier: "public.text", options: nil) { (data, error) in
            if let text = data as? String {
                if text.count > self.maxTextLength {
                    let filename = "shared-\(UUID().uuidString).txt"
                    if let savedUrl = self.saveDataToSharedContainer(data: Data(text.utf8), filename: filename),
                       let url = self.shareExtensionURL(params: ["mediaUris": savedUrl.absoluteString]) {
                        _ = self.openURL(url)
                    }
                } else if let url = self.shareExtensionURL(params: ["text": text]) {
                    _ = self.openURL(url)
                }
            }
            self.completeRequest()
        }
    }

    private func handleUrl(item: NSItemProvider) {
        item.loadItem(forTypeIdentifier: "public.url", options: nil) { (data, error) in
            if let url = data as? URL,
               let finalUrl = self.shareExtensionURL(params: ["url": url.absoluteString]) {
                _ = self.openURL(finalUrl)
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
