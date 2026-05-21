import { Text } from "@react-three/drei";

function FoodModel() {
  return (
    <group>
      {/* MAIN FOOD BOX */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.8, 1.2, 1.2]} />
        <meshStandardMaterial
          color="#ffb703"
          roughness={0.25}
          metalness={0.15}
        />
      </mesh>

      {/* TOP LID */}
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.9, 0.25, 1.3]} />
        <meshStandardMaterial
          color="#ffd166"
          roughness={0.2}
          metalness={0.2}
        />
      </mesh>

      {/* FRONT LABEL TEXT */}
      <Text
        position={[0, 0, 0.61]}
        fontSize={0.25}
        color="#5b4fd3"
        anchorX="center"
        anchorY="middle"
      >
        Food Rescue
      </Text>

      {/* SMALL ICON DOT (LOGO STYLE) */}
      <mesh position={[-0.6, 0.25, 0.62]}>
        <circleGeometry args={[0.12, 32]} />
        <meshStandardMaterial color="#ff5252" />
      </mesh>
    </group>
  );
}

export default FoodModel;
