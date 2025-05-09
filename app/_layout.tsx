import { Canvas } from "@react-three/fiber/native";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FaceControls, FaceName } from "./FaceControls";
import { RotateCmd, RubiksCube } from "./RubiksCube";

export default function RootLayout() {
  const dragVelocity = useRef({ dx: 0, dy: 0 });
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        dragVelocity.current.dx = g.vx * 100;
        dragVelocity.current.dy = g.vy * 100;
      },
    })
  ).current;

  const [rotateCmd, setRotateCmd]       = useState<RotateCmd>(null);
  const [resetSpin, setResetSpin]       = useState(false);
  const [resetState, setResetState]     = useState(false);

  const triggerResetSpin = () => {
    setResetSpin(true);
    setTimeout(() => setResetSpin(false), 50);
  };
  const triggerResetState = () => {
    setResetState(true);
    setTimeout(() => setResetState(false), 50);
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Canvas camera={{ position: [0, 0, 7], fov: 70 }}>
        <color attach="background" args={["#1a1a1a"]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 2, 2]} intensity={1.5} />
        <RubiksCube
          dragVelocity={dragVelocity}
          rotateCmd={rotateCmd}
          resetSpinSignal={resetSpin}
          resetStateSignal={resetState}
        />
      </Canvas>

      <View style={styles.overlay}>
        <Text style={styles.title}>CubeLink</Text>
        <Text style={styles.subtitle}>Drag to influence the cube</Text>

        <View style={styles.inlineButtons}>
          <Pressable style={styles.button} onPress={triggerResetSpin}>
            <Text style={styles.buttonText}>Reset Spin</Text>
          </Pressable>

          <Pressable
            style={[styles.button, { marginLeft: 12 }]}
            onPress={triggerResetState}
          >
            <Text style={styles.buttonText}>Reset State</Text>
          </Pressable>
        </View>
      </View>

      <FaceControls
        onRotate={(face: FaceName, dir) => {
          setRotateCmd({ face, dir });
          setTimeout(() => setRotateCmd(null), 100);
        }}
      />

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
    marginBottom: 12,
  },
  inlineButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#512DA8",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 100,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});