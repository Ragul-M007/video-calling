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
import VideoCall from "../../../components/VideoCall";

export default function SellerDashboard() {
  const { user, logout } = useAuth();
  const socketRef = useRef(null);

  const [isShopOpen, setIsShopOpen] = useState(
    () => sessionStorage.getItem("isShopOpen") === "true"
  );
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null); // new state

  const WS_URL = "ws://192.168.0.116:8000/videoCall/ws/room/join";

  useEffect(() => {
  sessionStorage.setItem("isShopOpen", isShopOpen);

  const localPayload = {
    user_id: 2,
    vendor_id: 2,
    product_id: 5,
  };

  if (isShopOpen) {
    socketRef.current = new WebSocket(WS_URL);

    socketRef.current.onopen = () => {
      console.log("✅ Connected to WebSocket");
      toast.success("Shop is online. Waiting for buyers...");
      socketRef.current.send(JSON.stringify(localPayload));
    };

    socketRef.current.onmessage = (event) => {
      console.log("📩 Message from server:", event.data);
      try {
        const msg = JSON.parse(event.data);

        if (msg.event === "call_request" && msg.is_incoming_call) {
          setIncomingCall(msg);
          toast.success(`Incoming call from ${msg.customer_name}`);
        }

        if (msg.event === "call_started") {
          setActiveCall(msg);
          toast.success("📞 Call started!");
        }
      } catch (err) {
        console.error("⚠️ Failed to parse server message:", err);
      }
    };

    socketRef.current.onclose = () => {
      console.log("❌ WebSocket closed");
      toast("Connection closed", { icon: "🔌" });
    };
  } else if (socketRef.current) {
    socketRef.current.close();
    socketRef.current = null;
  }

  return () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  };
}, [isShopOpen]);


  const toggleShop = () => {
    setIsShopOpen((prev) => !prev);
  };

  const handleAccept = () => {
    if (!incomingCall) return;

    const payload = {
      action: "accept_call",
      customer_id: incomingCall.customer_id,
    };

    socketRef.current?.send(JSON.stringify(payload));
    toast.success(`Accepted call from ${incomingCall.customer_name}`);
    setIncomingCall(null);
  };

  const handleReject = () => {
    if (!incomingCall) return;

    const payload = {
      action: "reject_call",
      customer_id: incomingCall.customer_id,
    };

    socketRef.current?.send(JSON.stringify(payload));
    toast.error(`Rejected call from ${incomingCall.customer_name}`);
    setIncomingCall(null);
  };

  // 🔴 End Call
  const handleEndCall = () => {
    if (!activeCall) return;

    const payload = {
      action: "end_call",
      customer_id: activeCall.customer_id,
      room_name: activeCall.room,
    };

    socketRef.current?.send(JSON.stringify(payload));
    toast.success("Call ended successfully");
    setActiveCall(null);
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
      {activeCall && (
        <div className="active-call-ui">
          <h2 className="text-center mb-2">📞 Live Call</h2>
          <VideoCall
            token={activeCall.token} // 🔑 must come from backend
            roomName={activeCall.room}
            onDisconnected={handleEndCall}
          />
        </div>
      )}

      {/* Incoming Call Dialog */}
      <Dialog open={!!incomingCall} onClose={handleReject}>
        <DialogTitle>📞 Incoming Call</DialogTitle>
        <DialogContent>
          <Typography>
            Customer <b>{incomingCall?.customer_name}</b> is calling about{" "}
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
