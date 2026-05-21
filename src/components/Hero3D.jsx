import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import FloatingGroup from "../three/FloatingGroup";
import FoodModel from "../three/FoodModel";
import Lights from "../three/Lights";

function Hero3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 45 }}
      shadows
      style={{ height: "100%", width: "100%" }}
    >
      {/* LIGHTS */}
      <Lights />

      {/* FLOATING MODEL */}
      <FloatingGroup>
        <FoodModel />
      </FloatingGroup>

      {/* OPTIONAL CONTROLS (LOCKED) */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 2}
      />
    </Canvas>
  );
}

export default Hero3D;