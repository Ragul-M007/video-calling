import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../auth/useAuth";
import { FaToggleOn, FaToggleOff } from "react-icons/fa";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import toast from "react-hot-toast";
import {
  LiveKitRoom,
  VideoConference,
} from "@livekit/components-react";
import "@livekit/components-styles";

export default function SellerDashboard() {
  const { user, logout } = useAuth();
  const socketRef = useRef(null);
  const cleanupTimeoutRef = useRef(null); // Prevent double cleanup

  const [isShopOpen, setIsShopOpen] = useState(() => sessionStorage.getItem("isShopOpen") === "true");
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [livekitToken, setLivekitToken] = useState(null);

  const WS_URL = "wss://livestreaming.emeetify.com/videoCall/ws/room/join";
  const LIVEKIT_URL = "wss://test-project-yjtscd8m.livekit.cloud/";

  // --- WebSocket & Call Management ---
  useEffect(() => {
    sessionStorage.setItem("isShopOpen", isShopOpen);

    if (isShopOpen) {
      // Prevent duplicate WebSocket
      if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED) {
        console.log("WebSocket already connected or connecting");
        return;
      }

      console.log("🔌 Opening WebSocket connection...");
      socketRef.current = new WebSocket(WS_URL);

      socketRef.current.onopen = () => {
        console.log("✅ Seller: Connected to WebSocket");
        toast.success("Shop is online. Waiting for buyers...");
        socketRef.current.send(
          JSON.stringify({
            user_id: 86,
            vendor_id: 86,
            product_id: 5,
          })
        );
      };

      socketRef.current.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          console.log("📩 Seller received:", msg);

          // Block new calls if already in one
          if (activeCall) {
            if (msg.event === "call_request") {
              console.log("📞 Busy: Rejecting new call from", msg.customer_name);
              socketRef.current?.send(
                JSON.stringify({
                  action: "reject_call",
                  customer_id: msg.customer_id,
                  reason: "busy",
                })
              );
              toast.info(`${msg.customer_name} was rejected — already in a call.`);
            }
            return;
          }

          if (msg.event === "call_request" && msg.is_incoming_call) {
            setIncomingCall(msg);
            toast.success(`📞 Incoming call from ${msg.customer_name}`);
          }

          if (msg.event === "call_started") {
            toast.success("📞 Call started!");
            setLivekitToken(msg.token);
            setActiveCall(msg);
            setIncomingCall(null);
          }

          if (msg.event === "call_ended") {
            toast.success(`📴 Call ended. Duration: ${msg.duration || 0}s`);
            endCallProperly();
          }
        } catch (err) {
          console.error("⚠️ Parse error:", err);
        }
      };

      socketRef.current.onclose = () => {
        console.log("❌ WebSocket closed");
      };

      socketRef.current.onerror = (err) => {
        console.error("🚨 WS Error:", err);
      };
    } else {
      socketRef.current?.close();
    }

    return () => {
      socketRef.current?.close();
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      if (activeCall) endCallProperly();
    };
  }, [isShopOpen, activeCall]);

  // --- Unified Call Cleanup (with timeout clear) ---
  const endCallProperly = () => {
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    setActiveCall(null);
    setLivekitToken(null);
    setIncomingCall(null);
    toast.dismiss("call");

    // Cleanup video tracks
    const videos = document.querySelectorAll("video");
    videos.forEach(video => {
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }
    });
  };

  // --- Toggle Shop ---
  const toggleShop = () => {
    if (activeCall) {
      toast.error("❌ Cannot close shop during an active call.");
      return;
    }
    setIsShopOpen((prev) => !prev);
  };

  // --- Call Actions ---
  const handleAccept = () => {
    if (!incomingCall) return;

    socketRef.current?.send(
      JSON.stringify({
        action: "accept_call",
        customer_id: incomingCall.customer_id,
      })
    );
    setIncomingCall(null);
  };

  const handleReject = () => {
    if (!incomingCall) return;

    socketRef.current?.send(
      JSON.stringify({
        action: "reject_call",
        customer_id: incomingCall.customer_id,
      })
    );
    toast.error(`Call from ${incomingCall.customer_name} rejected`);
    setIncomingCall(null);
  };

  // --- End Call (With Fallback) ---
  const handleEndCall = () => {
  if (!activeCall) return;

  console.log("🔚 Seller ending call...");

  // Prepare payload
  const payload = {
    action: "end_call",
    customer_id: activeCall.customer_id,
    room_name: activeCall.room,
  };

  // Send signal to server
  if (socketRef.current?.readyState === WebSocket.OPEN) {
    socketRef.current.send(JSON.stringify(payload));
    console.log("📤 Sent:", payload);
  } else {
    console.warn("WebSocket not open, skipping send");
  }

  // Wait for confirmation OR force cleanup after 3s
  cleanupTimeoutRef.current = setTimeout(() => {
    if (activeCall) {
      console.warn("🔁 Fallback: Cleaning up call (no server response)");
      endCallProperly();
    }
  }, 3000);
};


  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Seller Dashboard</h1>
          <p className="text-gray-600">Welcome, {user?.name}</p>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow"
        >
          Logout
        </button>
      </div>

      {/* Shop Status */}
      {!activeCall && (
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-700">Shop Status</h2>
            <button onClick={toggleShop}>
              {isShopOpen ? (
                <FaToggleOn className="text-4xl text-green-600 hover:text-green-700 transition" />
              ) : (
                <FaToggleOff className="text-4xl text-gray-500 hover:text-gray-600 transition" />
              )}
            </button>
          </div>
          <p className="mt-4 text-gray-600">
            {isShopOpen
              ? "✅ Your shop is open. Buyers can call you."
              : "❌ Your shop is closed. Buyers cannot call you."}
          </p>
        </div>
      )}

      {/* Active Call UI */}
      {activeCall && livekitToken && (
        <div className="max-w-5xl mx-auto mt-6">
          <h2 className="text-xl font-semibold mb-2">📞 In Call with {activeCall.customer_name}</h2>

          <LiveKitRoom
            serverUrl={LIVEKIT_URL}
            token={livekitToken}
            connect={true}
            onDisconnected={handleEndCall}
            video={true}
            audio={true}
            publishVideo={true}
            publishAudio={true}
            style={{ height: "600px" }}
          >
            <VideoConference />
          </LiveKitRoom>

          <button
            onClick={handleEndCall}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg"
          >
            End Call
          </button>
        </div>
      )}

      {/* Incoming Call Dialog */}
      <Dialog open={!!incomingCall} onClose={handleReject}>
        <DialogTitle>📞 Incoming Call</DialogTitle>
        <DialogContent>
          <Typography>
            Customer <b>{incomingCall?.customer_name}</b> wants to talk about{" "}
            <b>Product #{incomingCall?.product_id}</b>.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReject} color="error" variant="outlined">
            Reject
          </Button>
          <Button onClick={handleAccept} color="success" variant="contained">
            Accept
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}