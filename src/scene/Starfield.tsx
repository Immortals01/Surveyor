import { Stars } from "@react-three/drei";

export default function Starfield() {
  return (
    <group name="starfield">
      <Stars
        radius={58}
        depth={26}
        count={5400}
        factor={2.7}
        saturation={0.12}
        fade
        speed={0.22}
      />
    </group>
  );
}
