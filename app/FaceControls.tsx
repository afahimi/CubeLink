import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type FaceName = "front" | "back" | "left" | "right" | "up" | "down";

export function FaceControls({
  onRotate,
}: {
  onRotate: (face: FaceName, dir: "CW" | "CCW") => void;
}) {
  const faces: { key: FaceName; label: string }[] = [
    { key: "front", label: "F" },
    { key: "back",  label: "B" },
    { key: "left",  label: "L" },
    { key: "right", label: "R" },
    { key: "up",    label: "U" },
    { key: "down",  label: "D" },
  ];

  return (
    <View style={styles.bar}>
      {faces.map(({ key, label }) => (
        <Pressable
          key={key}
          style={styles.btn}
          onPress={() => onRotate(key, "CCW")}
        >
          <Text style={styles.txt}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingVertical: 8,
    borderRadius: 12,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#512DA8",
    alignItems: "center",
    justifyContent: "center",
  },
  txt: {
    color: "#fff",
    fontWeight: "600",
  },
});