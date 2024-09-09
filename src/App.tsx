import { useEffect, useState } from "react";

const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;

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
        setAlhpa(e.alpha!);
        setBeta(e.beta!);
        setGamma(e.gamma!);
      }
    });
  }, [hasAccess]);

  useEffect(() => {
    let x = (alpha / 360) * screenWidth;
    let y = ((beta + 180) / 360) * screenHeight;

    x = Math.max(0, Math.min(screenWidth - 20, x));
    y = Math.max(0, Math.min(screenHeight - 20, y));

    setX(x);
    setY(y);
  }, [alpha, beta, gamma]);

  async function getPermission() {
    const result = await getOrientation();
    setHasAccess(!!result);
  }

  return (
    <div>
      <button
        onClick={async () => {
          await getPermission();
        }}
      >
        Get permission
      </button>
      <div>Alpha: {alpha}</div>
      <div>Beta: {beta}</div>
      <div>Gamma: {gamma}</div>
      <div style={{ height: 50 }} />
      <div>X: {x}</div>
      <div>Y: {y}</div>
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
