import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export default function Header() {
  return (
    <View style={styles.headerContainer}>
      <Image
        source={require("../../assets/images/ube-logo.png")}
        style={styles.logoImage}
        resizeMode="contain"
      />
      <Text style={styles.headerTitle}>UniBookExchange</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  logoImage: {
    width: 45,
    height: 45,
    resizeMode: "contain",
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1E3A8A",
  },
});

