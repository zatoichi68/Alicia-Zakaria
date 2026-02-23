import Foundation
import CallKit
import UIKit

/// CallKitHelper gère l'interface d'appel native d'Apple (Écran vert/rouge).
/// Ce fichier est à importer dans votre projet Xcode (SwiftUI ou UIKit).
class CallKitHelper: NSObject, CXProviderDelegate {
    
    static let shared = CallKitHelper()
    private let provider: CXProvider
    private var currentCallUUID: UUID?
    
    // Callback déclenché quand l'utilisateur décroche
    var onCallAccepted: ((String) -> Void)?
    private var pendingRoomName: String?

    override init() {
        let config = CXProviderConfiguration(localizedName: "AlicIA & ZakarIA")
        config.supportsVideo = true
        config.maximumCallsPerCallGroup = 1
        config.supportedHandleTypes = [.generic]
        config.iconTemplateImageData = UIImage(named: "AppIcon")?.pngData()
        
        self.provider = CXProvider(configuration: config)
        super.init()
        self.provider.setDelegate(self, queue: nil)
    }

    /// Signaler un appel entrant (à appeler depuis le récepteur de notification FCM)
    func reportIncomingCall(uuid: UUID, handle: String, roomName: String) {
        self.currentCallUUID = uuid
        self.pendingRoomName = roomName
        
        let update = CXCallUpdate()
        update.remoteHandle = CXHandle(type: .generic, value: handle)
        update.hasVideo = true
        update.supportsDTMF = false
        update.supportsHolding = false
        update.supportsGrouping = false
        update.supportsUngrouping = false

        provider.reportNewIncomingCall(with: uuid, update: update) { error in
            if let error = error {
                print("❌ Erreur CallKit: \(error.localizedDescription)")
            } else {
                print("📞 Sonnerie CallKit lancée pour: \(handle)")
            }
        }
    }

    // MARK: - CXProviderDelegate

    func providerDidReset(_ provider: CXProvider) {
        // Nettoyage en cas de crash du système de téléphonie
        currentCallUUID = nil
    }

    // L'utilisateur clique sur le bouton vert "Décrocher"
    func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        print("✅ Appel accepté par l'utilisateur")
        
        if let room = pendingRoomName {
            // Déclencher la navigation vers Jitsi dans l'app
            onCallAccepted?(room)
        }
        
        action.fulfill()
    }

    // L'utilisateur clique sur le bouton rouge "Refuser" ou raccroche
    func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        print("🛑 Appel terminé/refusé")
        currentCallUUID = nil
        pendingRoomName = nil
        action.fulfill()
    }
    
    // Gestion du micro (Mute/Unmute)
    func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) {
        // Synchroniser l'état du micro avec votre SDK Vidéo (Jitsi/LiveKit)
        action.fulfill()
    }
}

/*
 MODE D'EMPLOI POUR XCODE :
 
 1. Dans votre AppDelegate ou SceneDelegate :
    CallKitHelper.shared.onCallAccepted = { roomName in
        // Naviguez vers votre vue Jitsi ici
    }
 
 2. Dans votre gestionnaire de notifications (MessagingDelegate) :
    func messaging(_ messaging: Messaging, didReceive remoteMessage: RemoteMessage) {
        if let room = remoteMessage.appData["roomName"] as? String {
            let uuid = UUID()
            CallKitHelper.shared.reportIncomingCall(uuid: uuid, handle: "AlicIA & ZakarIA", roomName: room)
        }
    }
*/
