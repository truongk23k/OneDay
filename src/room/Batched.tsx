import { useEffect, useMemo } from 'react'
import {
  BoxGeometry,
  BufferAttribute,
  CylinderGeometry,
  Euler,
  IcosahedronGeometry,
  Matrix4,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
  Color,
  type BufferGeometry,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { groupParts, type Mat, type Part } from './parts'

export const MATERIALS: Record<Mat, MeshStandardMaterial | MeshBasicMaterial> = {
  std: new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.85 }),
  metal: new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.35, metalness: 0.35 }),
  emit: new MeshBasicMaterial({ vertexColors: true }),
}

const tmpColor = new Color()

function partGeometry(p: Part): BufferGeometry {
  const raw =
    p.kind === 'box'
      ? new BoxGeometry(...p.size)
      : p.kind === 'cyl'
        ? new CylinderGeometry(p.rTop, p.rBottom, p.h, p.seg ?? 10)
        : new IcosahedronGeometry(p.r, 1)
  const g = raw.toNonIndexed()
  raw.dispose()
  const scale = p.kind === 'ico' && p.scale ? new Vector3(...p.scale) : new Vector3(1, 1, 1)
  const rot = p.rot ? new Quaternion().setFromEuler(new Euler(...p.rot)) : new Quaternion()
  g.applyMatrix4(new Matrix4().compose(new Vector3(...p.pos), rot, scale))
  tmpColor.set(p.color)
  const n = g.getAttribute('position').count
  const colors = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) colors.set([tmpColor.r, tmpColor.g, tmpColor.b], i * 3)
  g.setAttribute('color', new BufferAttribute(colors, 3))
  return g
}

// Gộp nhiều mảnh (đã tô màu theo đỉnh) thành một hình duy nhất.
export function mergeParts(parts: Part[]): BufferGeometry {
  const geoms = parts.map(partGeometry)
  const merged = mergeGeometries(geoms)
  geoms.forEach((g) => g.dispose())
  return merged
}

// Một lưới duy nhất từ các mảnh cùng chất liệu thường (dùng cho từng bộ phận nhân vật).
export function PartsMesh({ parts }: { parts: Part[] }) {
  const geom = useMemo(() => mergeParts(parts), [parts])
  useEffect(() => () => geom.dispose(), [geom])
  return <mesh geometry={geom} material={MATERIALS.std} />
}

// Gộp mọi mảnh cùng chất liệu thành một lưới duy nhất: cả phòng chỉ tốn vài lệnh vẽ.
export function Batched({ parts }: { parts: Part[] }) {
  const meshes = useMemo(
    () =>
      [...groupParts(parts)].map(([mat, list]) => ({ mat, geom: mergeParts(list) })),
    [parts],
  )
  useEffect(() => () => meshes.forEach((m) => m.geom.dispose()), [meshes])
  return (
    <>
      {meshes.map((m) => (
        <mesh key={m.mat} geometry={m.geom} material={MATERIALS[m.mat]} />
      ))}
    </>
  )
}
