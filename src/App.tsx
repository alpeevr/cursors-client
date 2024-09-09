import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export type Cursor = {
  color: string;
  position: {
    x: number;
    y: number;
  };
};

export type ServerToClientEvents = {
  cursor_updates: (cursors: Cursor[]) => void;
};

export type ClientToServerEvents = {
  cursor_receiver: (cursor: Omit<Cursor, "color">) => void;
};

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  "https://cursors-socket.onrender.com"
);

socket.on("connect", () => {
  console.log("Connected to the server");
});

function App() {
  const [hasAccess, setHasAccess] = useState(false);
  const initialAlpha = useRef<number | null>(null);
  const initialBeta = useRef<number | null>(null);

  useEffect(() => {
    if (!hasAccess) {
      getPermission();
      return;
    }

    if (!socket.connected) {
      return;
    }

    let position: Cursor["position"] = { x: 0, y: 0 };

    window.addEventListener("deviceorientation", (e) => {
      if (e.alpha !== null && e.beta !== null && e.gamma !== null) {
        const alpha = e.alpha; // Left-right tilt (-90 to 90)
        let beta = e.beta; // Forward-backward tilt (-180 to 180)

        if (beta < -45) beta = -45;
        if (beta > 45) beta = 45;

        // Map gamma to x (horizontal position)
        const x = (270 - alpha) / 360;

        // Map beta to y (vertical position)
        const y = (beta + 45) / 90;

        if (initialAlpha.current === null || initialBeta.current === null) {
          initialAlpha.current = x;
          initialBeta.current = y;
        }

        position = { x: x - initialAlpha.current, y: y - initialBeta.current };
      }
    });

    const handleChangePosition = () => {
      socket.emit("cursor_receiver", { position });
      requestAnimationFrame(handleChangePosition);
    };

    requestAnimationFrame(handleChangePosition);
  }, [hasAccess]);

  async function getPermission() {
    const result = await getOrientation();
    setHasAccess(!!result);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          onClick={async () => {
            await getPermission();
          }}
        >
          Get permission_{hasAccess ? "hasAccess" : "no access"}
        </button>
      </div>
    </div>
  );
}

async function getOrientation() {
  if (
    !window.DeviceOrientationEvent ||
    // @ts-expect-error-error
    !window.DeviceOrientationEvent.requestPermission
  ) {
    return alert(
      "Your current device does not have access to the DeviceOrientation event"
    );
  }

  // @ts-expect-error-error
  const permission = await window.DeviceOrientationEvent.requestPermission();

  if (permission !== "granted") {
    return alert("You must grant access to the device's sensor for this demo");
  }

  return true;
}

export default App;
