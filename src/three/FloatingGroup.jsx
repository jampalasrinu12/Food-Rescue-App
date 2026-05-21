import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

function FloatingGroup({ children }) {
  const ref = useRef();
  const { mouse } = useThree();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Idle floating motion
    ref.current.position.y = Math.sin(t) * 0.15;

    // Slow rotation
    ref.current.rotation.y += 0.002;

    // Parallax based on mouse
    ref.current.rotation.x = mouse.y * 0.4;
    ref.current.rotation.z = mouse.x * 0.4;
  });

  return <group ref={ref}>{children}</group>;
}

export default FloatingGroup;