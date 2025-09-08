// src/components/VideoCall.jsx
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
    <div style={{ height: "100vh", width: "100%" }}>
      <LiveKitRoom
        token={token}
        serverUrl="wss://test-project-yjtscd8m.livekit.cloud" // 👈 LiveKit server
        roomName={roomName}
        connect
        audio
        video
        onConnected={() => setConnected(true)}
        onDisconnected={onDisconnected}
      >
        <OneToOneUI />
      </LiveKitRoom>
    </div>
  );
}

/**
 * One-to-one call layout
 */
function OneToOneUI() {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);

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
