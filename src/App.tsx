import { useEffect, useState } from "react";
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
        let { alpha: x, beta: y } = e;

        x = x * -1;
        y = y * -1;

        if (x > 90) {
          x = 90;
        }
        if (x < -90) {
          x = -90;
        }

        x += 90;
        y += 90;

        position = { x: x / 180, y: y / 180 };
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
