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

    if (!socket.connected) {
      return;
    }

    let position: Cursor["position"] = { x: 0, y: 0 };
    let initialAlpha: number | null = null;
    let initialBeta: number | null = null;

    window.addEventListener("deviceorientation", (e) => {
      if (e.alpha !== null && e.beta !== null && e.gamma !== null) {
        const { alpha, beta, gamma } = e;

        if (initialAlpha === null || initialBeta === null) {
          initialAlpha = alpha;
          initialBeta = beta;
        }

        const deltaAlpha = alpha - initialAlpha;
        const deltaBeta = beta - initialBeta;

        setAlhpa(alpha);
        setBeta(beta);
        setGamma(gamma);

        const x = 0.5 + deltaAlpha / 360; // Small changes in alpha, mapped to (0, 1)
        const y = 0.5 + deltaBeta / 360; // Small changes in beta, mapped to (0, 1)

        const normalizedX = Math.max(0, Math.min(1, x));
        const normalizedY = Math.max(0, Math.min(1, y));

        setX(normalizedX);
        setY(normalizedY);

        position = { x: +normalizedX.toFixed(3), y: +normalizedY.toFixed(3) };
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
