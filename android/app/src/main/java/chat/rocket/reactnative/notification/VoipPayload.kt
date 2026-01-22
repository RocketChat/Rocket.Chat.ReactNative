package chat.rocket.reactnative.notification

import com.google.gson.annotations.SerializedName

data class VoipPayload(
    @SerializedName("callId")
    val callId: String?,
    
    @SerializedName("calleeId")
    val calleeId: String?,
    
    @SerializedName("caller")
    val caller: String?,
    
    @SerializedName("host")
    val host: String?,
    
    @SerializedName("type")
    val type: String?
) {
    /**
     * Converts this VoipPayload to an Ejson object for compatibility with existing VoipNotification code.
     * 
     * Since VoipNotification.showIncomingCall() expects an Ejson object, we create a minimal
     * Ejson instance with the necessary fields populated from this payload.
     */
    fun toEjson(): Ejson {
        val ejson = Ejson()
        
        // Map direct fields
        ejson.callId = this.callId
        ejson.host = this.host
        ejson.notificationType = "incoming_call"
        
        // Convert caller string to Caller object
        // The caller field is a string in the new format, but Ejson expects a Caller object
        if (!this.caller.isNullOrEmpty()) {
            val callerObj = Ejson.Caller()
            // Since we only have the caller name as a string, we'll use it as both name and username
            // This is a limitation - we don't have username in the new format
            callerObj.name = this.caller
            callerObj.username = this.caller // Use name as username fallback
            ejson.caller = callerObj
        }
        
        // Set senderName for compatibility with VoipNotification.showIncomingCall()
        // which checks senderName first when determining caller name
        ejson.senderName = this.caller
        
        return ejson
    }
    
    /**
     * Checks if this payload represents a VoIP incoming call.
     */
    fun isVoipIncomingCall(): Boolean {
        return type == "incoming_call" && !callId.isNullOrEmpty()
    }
}
