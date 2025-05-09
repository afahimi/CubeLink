import { useFrame } from "@react-three/fiber/native";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { FaceName } from "./FaceControls";

export type RotateCmd = { face: FaceName; dir: "CW" | "CCW" } | null;

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
        if (x === 1)  faceColors["+X"] = "red";
        if (x === -1) faceColors["-X"] = "orange";
        if (y === 1)  faceColors["+Y"] = "white";
        if (y === -1) faceColors["-Y"] = "yellow";
        if (z === 1)  faceColors["+Z"] = "blue";
        if (z === -1) faceColors["-Z"] = "green";

        cube.push({ id: `cubie-${id++}`, position: [x, y, z], faceColors });
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

// rotation helpers (same logic as before)
const rotateFaceColorsZ = (fc: Record<string, string>) => {
  const r: Record<string, string> = {};
  if (fc["+X"]) r["-Y"] = fc["+X"];
  if (fc["+Y"]) r["+X"] = fc["+Y"];
  if (fc["-X"]) r["+Y"] = fc["-X"];
  if (fc["-Y"]) r["-X"] = fc["-Y"];
  if (fc["+Z"]) r["+Z"] = fc["+Z"];
  if (fc["-Z"]) r["-Z"] = fc["-Z"];
  return r;
};
const rotateFaceColorsZ_CCW = (fc: Record<string, string>) => {
  const r: Record<string, string> = {};
  if (fc["+Y"]) r["-X"] = fc["+Y"];
  if (fc["-X"]) r["-Y"] = fc["-X"];
  if (fc["-Y"]) r["+X"] = fc["-Y"];
  if (fc["+X"]) r["+Y"] = fc["+X"];
  if (fc["+Z"]) r["+Z"] = fc["+Z"];
  if (fc["-Z"]) r["-Z"] = fc["-Z"];
  return r;
};
const rotateFaceColorsX = (fc: Record<string, string>) => {
  const r: Record<string, string> = {};
  if (fc["+Y"]) r["-Z"] = fc["+Y"];
  if (fc["-Z"]) r["-Y"] = fc["-Z"];
  if (fc["-Y"]) r["+Z"] = fc["-Y"];
  if (fc["+Z"]) r["+Y"] = fc["+Z"];
  if (fc["+X"]) r["+X"] = fc["+X"];
  if (fc["-X"]) r["-X"] = fc["-X"];
  return r;
};
const rotateFaceColorsX_CCW = (fc: Record<string, string>) => {
  const r: Record<string, string> = {};
  if (fc["+Y"]) r["+Z"] = fc["+Y"];
  if (fc["+Z"]) r["-Y"] = fc["+Z"];
  if (fc["-Y"]) r["-Z"] = fc["-Y"];
  if (fc["-Z"]) r["+Y"] = fc["-Z"];
  if (fc["+X"]) r["+X"] = fc["+X"];
  if (fc["-X"]) r["-X"] = fc["-X"];
  return r;
};
const rotateFaceColorsY = (fc: Record<string, string>) => {
  const r: Record<string, string> = {};
  if (fc["+Z"]) r["-X"] = fc["+Z"];
  if (fc["-X"]) r["-Z"] = fc["-X"];
  if (fc["-Z"]) r["+X"] = fc["-Z"];
  if (fc["+X"]) r["+Z"] = fc["+X"];
  if (fc["+Y"]) r["+Y"] = fc["+Y"];
  if (fc["-Y"]) r["-Y"] = fc["-Y"];
  return r;
};
const rotateFaceColorsY_CCW = (fc: Record<string, string>) => {
  const r: Record<string, string> = {};
  if (fc["+Z"]) r["+X"] = fc["+Z"];
  if (fc["+X"]) r["-Z"] = fc["+X"];
  if (fc["-Z"]) r["-X"] = fc["-Z"];
  if (fc["-X"]) r["+Z"] = fc["-X"];
  if (fc["+Y"]) r["+Y"] = fc["+Y"];
  if (fc["-Y"]) r["-Y"] = fc["-Y"];
  return r;
};

export function RubiksCube({
  dragVelocity,
  rotateCmd,
  resetSpinSignal,
  resetStateSignal,
}: {
  dragVelocity: React.MutableRefObject<{ dx: number; dy: number }>;
  rotateCmd: RotateCmd;
  resetSpinSignal: boolean;
  resetStateSignal: boolean;
}) {
  const cubeGroupRef = useRef<THREE.Group>(null!);
  const rotatingRef  = useRef<THREE.Group>(null!);
  const sliceCfg     = useRef<{
    axis: "x" | "y" | "z";
    dir: "CW" | "CCW";
    cwFn: typeof rotateFaceColorsZ;
    ccwFn: typeof rotateFaceColorsZ_CCW;
  } | null>(null);

  const [cubeState, setCubeState]     = useState(createCubeState());
  const [rotatingIds, setRotatingIds] = useState<string[]>([]);
  const [isRotating, setIsRotating]   = useState(false);

  // reset camera
  useEffect(() => {
    if (resetSpinSignal && cubeGroupRef.current) {
      cubeGroupRef.current.rotation.set(0, 0, 0);
    }
  }, [resetSpinSignal]);

  // reset entire cube
  useEffect(() => {
    if (resetStateSignal) {
      setCubeState(createCubeState());
      setRotatingIds([]);
      setIsRotating(false);
      sliceCfg.current = null;
      rotatingRef.current.rotation.set(0, 0, 0);
      cubeGroupRef.current.rotation.set(0, 0, 0);
    }
  }, [resetStateSignal]);

  // pick slice when rotateCmd fires
  useEffect(() => {
    if (rotateCmd && !isRotating) {
      const { face, dir } = rotateCmd;
      let axis: "x" | "y" | "z";
      let coord: number;
      let cwFn, ccwFn;
      if (face === "front" || face === "back") {
        axis = "z";
        coord = face === "front" ? 1 : -1;
        cwFn  = rotateFaceColorsZ;
        ccwFn = rotateFaceColorsZ_CCW;
      } else if (face === "right" || face === "left") {
        axis = "x";
        coord = face === "right" ? 1 : -1;
        cwFn  = rotateFaceColorsX;
        ccwFn = rotateFaceColorsX_CCW;
      } else {
        axis = "y";
        coord = face === "up" ? 1 : -1;
        cwFn  = rotateFaceColorsY;
        ccwFn = rotateFaceColorsY_CCW;
      }
      const idx = axis === "x" ? 0 : axis === "y" ? 1 : 2;
      const ids = cubeState
        .filter((c) => c.position[idx] === coord)
        .map((c) => c.id);

      sliceCfg.current = { axis, dir, cwFn, ccwFn };
      setRotatingIds(ids);
      setIsRotating(true);
    }
  }, [rotateCmd]);

  // animation loop
  useFrame((_, delta) => {
    // camera drag + auto-spin
    const dv = dragVelocity.current;
    if (cubeGroupRef.current) {
      const rx = cubeGroupRef.current.rotation.x % (2 * Math.PI);
      const inv = rx > Math.PI / 2 && rx < (3 * Math.PI) / 2;
      cubeGroupRef.current.rotation.y += dv.dx * 0.002 * (inv ? -1 : 1);
      cubeGroupRef.current.rotation.x += dv.dy * 0.002;
      dv.dx *= 0.9;
      dv.dy *= 0.9;
    }
    if (!isRotating && cubeGroupRef.current) {
      cubeGroupRef.current.rotation.y += delta * 0.1;
      cubeGroupRef.current.rotation.x += delta * 0.05;
    }

    // slice animation
    if (isRotating && sliceCfg.current) {
      const { axis, dir, cwFn, ccwFn } = sliceCfg.current;
      const groupRot = rotatingRef.current.rotation as any;
      const step = (Math.PI / 2) * delta * 2;
      groupRot[axis] += dir === "CCW" ? step : -step;

      if (Math.abs(groupRot[axis]) >= Math.PI / 2) {
        rotatingRef.current.rotation.set(0, 0, 0);
        setCubeState((prev) =>
          prev.map((c) => {
            if (!rotatingIds.includes(c.id)) return c;
            const [x, y, z] = c.position;
            let np: [number, number, number];
            if (axis === "z") {
              np = dir === "CCW" ? [-y, x, z] : [y, -x, z];
            } else if (axis === "x") {
              np = dir === "CCW" ? [x, -z, y] : [x, z, -y];
            } else {
              np = dir === "CCW" ? [z, y, -x] : [-z, y, x];
            }
            const rotFn = dir === "CCW" ? ccwFn : cwFn;
            return { ...c, position: np, faceColors: rotFn(c.faceColors) };
          })
        );
        setRotatingIds([]);
        setIsRotating(false);
        sliceCfg.current = null;
      }
    }
  });

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