import { useAuth } from "../../../auth/useAuth";
import imagesiphone14pro from "../../../assets/iphone.webp";
import "./BuyerDashboard.css";
import { useRef, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";

export default function BuyerDashboard() {
  const { user, logout } = useAuth();
  const socketRef = useRef(null);
  const isMounted = useRef(true);

  const [activeCall, setActiveCall] = useState(null);
  const [livekitToken, setLivekitToken] = useState(null);

  const WS_URL = "wss://livestreaming.emeetify.com/videoCall/ws/room/join";
  const LIVEKIT_URL = "wss://test-project-yjtscd8m.livekit.cloud/";

  const products = [
    {
      id: 1,
      userId: 47,
      name: "iPhone 14 Pro",
      price: "$999",
      image: imagesiphone14pro,
      vendorId: 86,
      productId: 5,
    },
    {
      id: 2,
      userId: 43,
      name: "MacBook Pro 16",
      price: "$2499",
      image: imagesiphone14pro,
      vendorId: 86,
      productId: 5,
    },
  ];

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (socketRef.current && 
          (socketRef.current.readyState === WebSocket.OPEN || 
           socketRef.current.readyState === WebSocket.CONNECTING)) {
        socketRef.current.close();
      }

      // Cleanup video tracks
      const videos = document.querySelectorAll("video");
      videos.forEach(video => {
        if (video.srcObject) {
          video.srcObject.getTracks().forEach(track => track.stop());
          video.srcObject = null;
        }
      });
    };
  }, []);

  // --- Unified Cleanup ---
  const endCallProperly = () => {
    setActiveCall(null);
    setLivekitToken(null);
    toast.dismiss("call");
  };

  const handleBuyNow = (product) => {
    alert(`Buying: ${product.name} for ${product.price}`);
  };

  // --- Call Vendor: Connect WebSocket Only When Needed ---
  const handleCallVendor = (product) => {
    if (activeCall) {
      toast.info("You're already in a call.");
      return;
    }

    // Close any existing connection
    if (socketRef.current && 
        (socketRef.current.readyState === WebSocket.OPEN || 
         socketRef.current.readyState === WebSocket.CONNECTING)) {
      socketRef.current.close();
    }

    const payload = {
      action: "call_request",
      user_id: product.userId,
      vendor_id: product.vendorId,
      product_id: product.productId,
      customer_name: user?.name || "Unknown Buyer",
    };

    toast.loading("🔄 Connecting to server...", { id: "call" });

    const ws = new WebSocket(WS_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      if (!isMounted.current) return;
      console.log("✅ Buyer: Connected to signaling server");
      ws.send(JSON.stringify(payload));
      toast.success("📞 Call request sent!");
    };

    ws.onmessage = (event) => {
      if (!isMounted.current) return;

      try {
        const msg = JSON.parse(event.data);
        console.log("📩 Buyer received:", msg);

        if (msg.event === "request_sent" && msg.vendor_online === false) {
          toast.error("Vendor is offline. Try later.", { id: "call" });
        }

        if (msg.event === "request_sent" && msg.reason === "busy") {
          toast.error("Seller is busy. Try again later.", { id: "call" });
        }

        if (msg.event === "call_started") {
          toast.dismiss("call");
          toast.success("📞 Call started!", { id: "call" });
          setLivekitToken(msg.token);
          setActiveCall(msg);
        }

        if (msg.event === "call_ended") {
          toast.success(`📴 Call ended. Duration: ${msg.duration || 0}s`);
          endCallProperly();
        }
      } catch (err) {
        console.error("⚠️ Parse error:", err);
      }
    };

    ws.onerror = () => {
      if (!isMounted.current) return;
      console.error("🚨 WebSocket error");
      toast.error("⚠️ Failed to connect to server", { id: "call" });
    };

    ws.onclose = () => {
      console.log("❌ WebSocket closed");
    };
  };

  // --- End Call (Send signal + cleanup) ---
  const handleEndCall = () => {
    if (!activeCall) return;

    socketRef.current?.send(
      JSON.stringify({
        action: "end_call",
        customer_id: activeCall.customer_id || user?.id,
        room_name: activeCall.room,
      })
    );
    endCallProperly();
  };

  // --- Auto cleanup video tracks when call ends ---
  useEffect(() => {
    if (!activeCall) {
      const videos = document.querySelectorAll("video");
      videos.forEach(video => {
        if (video.srcObject) {
          const tracks = video.srcObject.getTracks();
          tracks.forEach(track => track.stop());
          video.srcObject = null;
        }
      });
    }
  }, [activeCall]);

  return (
    <div className="buyer-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Buyer Dashboard</h1>
          <p>Welcome, {user?.name}</p>
        </div>
        <button onClick={logout} className="logout-btn">
          Logout
        </button>
      </div>

      {/* Product Grid or Active Call */}
      {!activeCall ? (
        <div className="product-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <img src={product.image} alt={product.name} />
              <h2>{product.name}</h2>
              <p>{product.price}</p>
              <button onClick={() => handleBuyNow(product)} className="buy-btn">
                Buy Now
              </button>
              <button
                onClick={() => handleCallVendor(product)}
                className="call-btn"
              >
                Call Vendor
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="active-call-ui">
          {livekitToken ? (
            <>
              <h2 className="text-xl font-semibold">📞 In Call with Seller</h2>

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
            </>
          ) : (
            <p>Connecting to call...</p>
          )}
        </div>
      )}
    </div>
  );
}