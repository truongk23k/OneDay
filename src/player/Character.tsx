import { CHARACTER_HEIGHT } from '../room/layout'

const SKIN = '#e9b98f'
const HAIR = '#1c1a19'

type Props = { top: string; bottom: string; shoes: string }

// Nhân vật Anh low-poly, cao CHARACTER_HEIGHT, mặt hướng về -z. Tóc đen vuốt dựng hơi bù xù.
export function Character({ top, bottom, shoes }: Props) {
  const k = CHARACTER_HEIGHT / 1.3
  return (
    <group scale={k}>
      {/* Giày dép */}
      {[-0.08, 0.08].map((x) => (
        <mesh key={`shoe${x}`} position={[x, 0.03, -0.02]}>
          <boxGeometry args={[0.09, 0.06, 0.17]} />
          <meshStandardMaterial color={shoes} flatShading />
        </mesh>
      ))}
      {/* Chân */}
      {[-0.08, 0.08].map((x) => (
        <mesh key={`leg${x}`} position={[x, 0.27, 0]}>
          <cylinderGeometry args={[0.055, 0.05, 0.42, 7]} />
          <meshStandardMaterial color={SKIN} flatShading />
        </mesh>
      ))}
      {/* Quần short */}
      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.17, 0.16, 0.22, 8]} />
        <meshStandardMaterial color={bottom} flatShading />
      </mesh>
      {/* Áo */}
      <mesh position={[0, 0.84, 0]}>
        <cylinderGeometry args={[0.185, 0.17, 0.44, 8]} />
        <meshStandardMaterial color={top} flatShading />
      </mesh>
      {/* Tay áo cộc + cánh tay */}
      {[-1, 1].map((side) => (
        <group key={`arm${side}`} position={[side * 0.235, 0.98, 0]} rotation-z={side * 0.12}>
          <mesh position={[0, -0.04, 0]}>
            <cylinderGeometry args={[0.068, 0.062, 0.12, 7]} />
            <meshStandardMaterial color={top} flatShading />
          </mesh>
          <mesh position={[0, -0.24, 0]}>
            <cylinderGeometry args={[0.048, 0.042, 0.3, 7]} />
            <meshStandardMaterial color={SKIN} flatShading />
          </mesh>
        </group>
      ))}
      {/* Cổ + đầu */}
      <mesh position={[0, 1.08, 0]}>
        <cylinderGeometry args={[0.05, 0.055, 0.06, 7]} />
        <meshStandardMaterial color={SKIN} flatShading />
      </mesh>
      <mesh position={[0, 1.17, 0]}>
        <icosahedronGeometry args={[0.135, 1]} />
        <meshStandardMaterial color={SKIN} flatShading />
      </mesh>
      {/* Tóc: chỏm + vài lọn dựng */}
      <mesh position={[0, 1.205, 0.012]} scale={[1.05, 0.8, 1.05]}>
        <icosahedronGeometry args={[0.14, 1]} />
        <meshStandardMaterial color={HAIR} flatShading />
      </mesh>
      {[
        [-0.06, 1.31, -0.04, -0.4],
        [0.02, 1.33, -0.07, -0.55],
        [0.08, 1.3, -0.02, -0.3],
      ].map(([x, y, z, tilt]) => (
        <mesh key={`tuft${x}`} position={[x, y, z]} rotation-x={tilt}>
          <coneGeometry args={[0.04, 0.1, 5]} />
          <meshStandardMaterial color={HAIR} flatShading />
        </mesh>
      ))}
      {/* Mũi chỉ hướng mặt */}
      <mesh position={[0, 1.16, -0.135]} rotation-x={-Math.PI / 2}>
        <coneGeometry args={[0.022, 0.05, 5]} />
        <meshStandardMaterial color="#dca47c" flatShading />
      </mesh>
    </group>
  )
}
