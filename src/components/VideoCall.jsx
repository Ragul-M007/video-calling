import PropTypes from "prop-types";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import { useEffect, useState } from "react";

export default function VideoCall({ token, roomName, onDisconnected }) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (connected) {
      console.log("✅ Joined LiveKit room:", roomName);
    }
  }, [connected, roomName]);

  return (
    <div
      style={{
        height: "80vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <LiveKitRoom
        token={token}
        serverUrl="wss://test-project-yjtscd8m.livekit.cloud"
        roomName={roomName}
        connect
        audio={{
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        }}
        video={{ facingMode: "user" }}
        onConnected={() => setConnected(true)}
        onDisconnected={onDisconnected}
      >
        <OneToOneUI />
      </LiveKitRoom>

      {/* 🔴 End Call Button */}
      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <button
          onClick={onDisconnected}
          style={{
            padding: "10px 20px",
            backgroundColor: "#e63946",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          End Call
        </button>
      </div>
    </div>
  );
}

VideoCall.propTypes = {
  token: PropTypes.string.isRequired,
  roomName: PropTypes.string.isRequired,
  onDisconnected: PropTypes.func.isRequired,
};

function OneToOneUI() {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
  ]);

  return (
    <GridLayout
      tracks={tracks}
      style={{ height: "100%", width: "100%", background: "#000" }}
    >
      {(trackRef) => (
        <ParticipantTile
          key={trackRef.publication?.trackSid}
          trackRef={trackRef}
          style={{ borderRadius: "10px", overflow: "hidden" }}
        />
      )}
    </GridLayout>
  );
}
