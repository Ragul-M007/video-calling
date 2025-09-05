import { useAuth } from "../../../auth/useAuth";
import imagesiphone14pro from "../../../assets/iphone.webp";
import "./BuyerDashboard.css";
import { useRef, useEffect, useState } from "react";
import toast from "react-hot-toast";
import VideoCall from "../../../components/VideoCall";

export default function BuyerDashboard() {
  const { user, logout } = useAuth();
  const socketRef = useRef(null);
  const [activeCall, setActiveCall] = useState(null);

  const WS_URL = "ws://192.168.0.116:8000/videoCall/ws/room/join";

  const products = [
    {
      id: 1,
      userId: 1,
      name: "iPhone 14 Pro",
      price: "$999",
      image: imagesiphone14pro,
      vendorPhone: "+1-123-456-7890",
      vendorId: 2,
      productId: 5,
    },
    {
      id: 2,
      userId: 3,
      name: "MacBook Pro 16",
      price: "$2499",
      image: imagesiphone14pro,
      vendorPhone: "+1-555-333-2222",
      vendorId: 2,
      productId: 5,
    },
  ];

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const connectSocket = (payload) => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    socketRef.current = new WebSocket(WS_URL);

    socketRef.current.onopen = () => {
      console.log("✅ Connected to WebSocket (Buyer side)");
      socketRef.current.send(JSON.stringify(payload));
    };

    socketRef.current.onmessage = (event) => {
      console.log("📩 Message from server:", event.data);

      try {
        const msg = JSON.parse(event.data);

        if (msg.event === "request_sent" && msg.vendor_online === false) {
          toast.error(msg.message || "Vendor is offline, please try later.");
        }

        if (msg.event === "call_started") {
          setActiveCall(msg);
          toast.success("📞 Call started!");
        }

        if (msg.event === "call_ended") {
          toast.success(
            `📴 Call ended. Duration: ${msg.duration || 0} seconds`
          );
          setActiveCall(null); // reset UI back to product list
        }
      } catch (err) {
        console.error("⚠️ Failed to parse message:", err);
      }
    };
  };

  const handleBuyNow = (product) => {
    alert(`Buying: ${product.name} for ${product.price}`);
  };

  const handleCallVendor = (product) => {
    const payload = {
      user_id: product.userId,
      vendor_id: product.vendorId,
      product_id: product.productId,
    };

    connectSocket(payload);
  };

  // 🔴 End Call manually
  const handleEndCall = () => {
    if (!activeCall) return;

    const payload = {
      action: "end_call",
      customer_id: activeCall.customer_id || user?.id,
      room_name: activeCall.room,
    };

    socketRef.current?.send(JSON.stringify(payload));
    toast.success("You ended the call");
    setActiveCall(null);
  };

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
            <h2 className="text-center mb-2">📞 In Call</h2>
            <VideoCall
            token={activeCall.token}   // 🔑 must come from backend
            roomName={activeCall.room}
            onDisconnected={handleEndCall}
            />
        </div>
      )}
    </div>
  );
}
