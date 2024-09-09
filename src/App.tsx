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

const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  "https://cursors-socket.onrender.com"
);

socket.on("connect", () => {
  console.log("Connected to the server");
});

function App() {
  const [hasAccess, setHasAccess] = useState(false);
  const [alpha, setAlhpa] = useState(0);
  const [beta, setBeta] = useState(0);
  const [gamma, setGamma] = useState(0);

  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  useEffect(() => {
    if (!hasAccess) {
      getPermission();
      return;
    }

    window.addEventListener("deviceorientation", (e) => {
      if (e.alpha !== null && e.beta !== null && e.gamma !== null) {
        const { alpha, beta, gamma } = e;

        setAlhpa(alpha);
        setBeta(beta);
        setGamma(gamma);

        const x = alpha / 360;
        const y = (beta + 180) / 360;

        const mappedX = x * screenWidth;
        const mappedY = y * screenHeight;

        setX(mappedX);
        setY(mappedY);

        if (socket.connected) {
          socket.emit("cursor_receiver", {
            position: { x, y },
          });
        }
      }
    });
  }, [hasAccess]);

  async function getPermission() {
    const result = await getOrientation();
    setHasAccess(!!result);
  }

  return (
    <div>
      {!hasAccess ? (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            onClick={async () => {
              await getPermission();
            }}
          >
            Get permission
          </button>
        </div>
      ) : (
        <div>
          <div>Alpha: {alpha}</div>
          <div>Beta: {beta}</div>
          <div>Gamma: {gamma}</div>
          <div style={{ height: 50 }} />
          <div>X: {x}</div>
          <div>Y: {y}</div>
        </div>
      )}
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
