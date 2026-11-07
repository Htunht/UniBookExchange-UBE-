import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";

export default function AuthBrandHeader() {
  return (
    <View style={styles.brandContainer}>
      <View style={styles.brandIcon}>
        <Image
          source={require("../../assets/images/ube-logo.png")}
          style={styles.brandImage}
          contentFit="contain"
        />
      </View>
      <Text style={styles.appTitle}>UBE</Text>
      <Text style={styles.appSubtitle}>UniBookExchange</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brandContainer: {
    alignItems: "center",
    marginBottom: 28,
  },
  brandIcon: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#E0F2FE",
  },
  brandImage: {
    width: 68,
    height: 68,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0284C7",
    letterSpacing: 2,
  },
  appSubtitle: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
