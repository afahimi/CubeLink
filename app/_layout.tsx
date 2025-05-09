import { Canvas, useFrame } from "@react-three/fiber/native";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import { PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import "react-native-reanimated";
import * as THREE from "three";
import { RubiksCube } from "./RubiksCube";

function FloatingCube({
  dragVelocity,
  resetSignal,
}: {
  dragVelocity: React.MutableRefObject<{ dx: number; dy: number }>;
  resetSignal: React.MutableRefObject<boolean>;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const rotation = useRef({ x: 0, y: 0 });

  useFrame((_, delta) => {
    // Handle reset
    if (resetSignal.current) {
      rotation.current = { x: 0, y: 0 };
      resetSignal.current = false;
    }

    const currentX = rotation.current.x % (Math.PI * 2);
    const isUpsideDown = currentX > Math.PI / 2 && currentX < (3 * Math.PI) / 2;

    // Apply user drag + auto-rotation
    rotation.current.x += dragVelocity.current.dy * 0.001;

    if (isUpsideDown) {
      rotation.current.y -= dragVelocity.current.dx * 0.001;
    } else {
      rotation.current.y += dragVelocity.current.dx * 0.001;
    }

    rotation.current.y += delta * 0.2;

    if (meshRef.current) {
      meshRef.current.rotation.x = rotation.current.x;
      meshRef.current.rotation.y = rotation.current.y;
    }

    // Decay drag velocity
    dragVelocity.current.dx *= 0.95;
    dragVelocity.current.dy *= 0.95;
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
}

export default function RootLayout() {
  const dragVelocity = useRef({ dx: 0, dy: 0 });
  const resetSignal = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        dragVelocity.current.dx = gesture.vx * 100;
        dragVelocity.current.dy = gesture.vy * 100;
      },
    })
  ).current;

  const [triggerFrontRotate, setTriggerFrontRotate] = useState(false);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Canvas camera={{ position: [0, 0, 7], fov: 70 }}>
        <color attach="background" args={["#1a1a1a"]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 2, 2]} intensity={1.5} />
        <RubiksCube
          triggerFrontRotate={triggerFrontRotate}
          dragVelocity={dragVelocity}
        />
      </Canvas>

      <View style={styles.overlay}>
        <Text style={styles.title}>CubeLink</Text>
        <Text style={styles.subtitle}>Drag to influence the cube</Text>
        <Pressable
          style={styles.button}
          onPress={() => {
            dragVelocity.current = { dx: 0, dy: 0 };
            resetSignal.current = true;
          }}
        >
          <Text style={styles.buttonText}>Reset Spin</Text>
        </Pressable>
        <Pressable
          style={[styles.button, { marginTop: 12 }]}
          onPress={() => {
            setTriggerFrontRotate(true);
            // reset after a brief moment so child effect can re-fire next time
            setTimeout(() => setTriggerFrontRotate(false), 100);
          }}
        >
          <Text style={styles.buttonText}>Rotate Front Face</Text>
        </Pressable>
      </View>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#aaa",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#512DA8",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 100,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
