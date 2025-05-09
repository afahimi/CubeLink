import { useFrame } from "@react-three/fiber/native";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// build the initial 3×3×3 state
function createCubeState() {
  const positions = [-1, 0, 1];
  let id = 0;
  const cube: {
    id: string;
    position: [number, number, number];
    faceColors: Record<string, string>;
  }[] = [];

  for (let x of positions) {
    for (let y of positions) {
      for (let z of positions) {
        const faceColors: Record<string, string> = {};
        if (x === 1) faceColors["+X"] = "red";
        if (x === -1) faceColors["-X"] = "orange";
        if (y === 1) faceColors["+Y"] = "white";
        if (y === -1) faceColors["-Y"] = "yellow";
        if (z === 1) faceColors["+Z"] = "blue";
        if (z === -1) faceColors["-Z"] = "green";

        cube.push({
          id: `cubie-${id++}`,
          position: [x, y, z],
          faceColors,
        });
      }
    }
  }

  return cube;
}

function Cubie({
  position,
  faceColors,
}: {
  position: [number, number, number];
  faceColors: Record<string, string>;
}) {
  const materials = [
    new THREE.MeshStandardMaterial({ color: faceColors["+X"] ?? "#111" }),
    new THREE.MeshStandardMaterial({ color: faceColors["-X"] ?? "#111" }),
    new THREE.MeshStandardMaterial({ color: faceColors["+Y"] ?? "#111" }),
    new THREE.MeshStandardMaterial({ color: faceColors["-Y"] ?? "#111" }),
    new THREE.MeshStandardMaterial({ color: faceColors["+Z"] ?? "#111" }),
    new THREE.MeshStandardMaterial({ color: faceColors["-Z"] ?? "#111" }),
  ];

  return (
    <mesh position={position} material={materials}>
      <boxGeometry args={[0.95, 0.95, 0.95]} />
    </mesh>
  );
}

function rotateFaceColorsZ(fc: Record<string, string>) {
   
    const rotated: Record<string, string> = {};
  
    // move side stickers clockwise
    if (fc["+X"]) rotated["-Y"] = fc["+X"];
    if (fc["+Y"]) rotated["+X"] = fc["+Y"];
    if (fc["-X"]) rotated["+Y"] = fc["-X"];
    if (fc["-Y"]) rotated["-X"] = fc["-Y"];
  
    // keep front/back as-is
    if (fc["+Z"]) rotated["+Z"] = fc["+Z"];
    if (fc["-Z"]) rotated["-Z"] = fc["-Z"];
    
    console.log(fc, rotated);
    return rotated;
  }

  function rotateFaceColorsZ_CCW(fc: Record<string, string>) {
    const rotated: Record<string, string> = {};
  
    // rotate the side stickers counterclockwise
    // top (+Y)    → left (-X)
    // left (-X)   → bottom (-Y)
    // bottom (-Y) → right (+X)
    // right (+X)  → top (+Y)
  
    if (fc["+Y"]) rotated["-X"] = fc["+Y"];
    if (fc["-X"]) rotated["-Y"] = fc["-X"];
    if (fc["-Y"]) rotated["+X"] = fc["-Y"];
    if (fc["+X"]) rotated["+Y"] = fc["+X"];
  
    // keep front/back
    if (fc["+Z"]) rotated["+Z"] = fc["+Z"];
    if (fc["-Z"]) rotated["-Z"] = fc["-Z"];
  
    return rotated;
  }
  

export function RubiksCube({
  triggerFrontRotate,
  dragVelocity,
}: {
  triggerFrontRotate: boolean;
  dragVelocity: React.MutableRefObject<{ dx: number; dy: number }>;
}) {
  // **1. refs & state inside the component**
  const cubeGroupRef = useRef<THREE.Group>(null!);
  const rotatingRef = useRef<THREE.Group>(null!);

  const [cubeState, setCubeState] = useState(createCubeState());
  const [rotatingIds, setRotatingIds] = useState<string[]>([]);
  const [isRotating, setIsRotating] = useState(false);

  // **2. when trigger flips true, collect all z=1 cubie IDs & start rotation**
  useEffect(() => {
    if (triggerFrontRotate && !isRotating) {
      const faceIds = cubeState
        .filter((c) => c.position[2] === 1)
        .map((c) => c.id);

      setRotatingIds(faceIds);
      setIsRotating(true);
    }
  }, [triggerFrontRotate]);

  // **3. on every frame: auto‐rotate whole cube + animate rotating slice**
    useFrame((_, delta) => {
      // 1) apply drag-based rotation with inversion when upside-down
      const dv = dragVelocity.current;
      if (cubeGroupRef.current) {
        // figure out if we're flipped over on X
        const rx = cubeGroupRef.current.rotation.x % (2 * Math.PI);
        const isUpsideDown = rx > Math.PI / 2 && rx < (3 * Math.PI) / 2;

        // invert horizontal drag once inverted
        const hSign = isUpsideDown ? -1 : 1;

        cubeGroupRef.current.rotation.y += dv.dx * 0.002 * hSign;
        cubeGroupRef.current.rotation.x += dv.dy * 0.002;

        // decay for inertia
        dv.dx *= 0.9;
        dv.dy *= 0.9;
      }

      // 2) keep your existing auto-spin when not rotating a slice
      if (!isRotating && cubeGroupRef.current) {
        cubeGroupRef.current.rotation.y += delta * 0.1;
        cubeGroupRef.current.rotation.x += delta * 0.05;
      }

      // animate the slice
      if (isRotating && rotatingRef.current) {
        const step = (Math.PI / 2) * delta * 2; // 90° in ~0.5s
        rotatingRef.current.rotation.z += step;

        // once we reach 90°, snap, update state, clear
        if (rotatingRef.current.rotation.z >= Math.PI / 2) {
          rotatingRef.current.rotation.set(0, 0, 0);

          setCubeState((prev) =>
            prev.map((c) => {
              if (!rotatingIds.includes(c.id)) return c;

              const [x, y, z] = c.position;
              return {
                ...c,
                // 1) move the piece
                position: [-y, x, z],
                // 2) rotate its stickers
                faceColors: rotateFaceColorsZ_CCW(c.faceColors),
              };
            })
          );

          setRotatingIds([]);
          setIsRotating(false);
        }
      }
    });

    useEffect(() => {
        console.log(cubeState);
    }, [cubeState]);

  // **4. render two groups: rotating slice on top, then the rest**
  return (
    <group ref={cubeGroupRef}>
      <group ref={rotatingRef}>
        {cubeState
          .filter((c) => rotatingIds.includes(c.id))
          .map((c) => (
            <Cubie key={c.id} {...c} />
          ))}
      </group>

      {cubeState
        .filter((c) => !rotatingIds.includes(c.id))
        .map((c) => (
          <Cubie key={c.id} {...c} />
        ))}
    </group>
  );
}
