import { Image } from "expo-image";
import { View } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { Colors } from "@/constants/theme";

import { Icon } from "./icon";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const DIAMETER: Record<AvatarSize, number> = {
  xs: 32,
  sm: 44,
  md: 60,
  lg: 92,
  xl: 112,
};

export type AvatarProps = {
  /** Photo de l'animal. Absente → repli icône. */
  uri?: string | null;
  size?: AvatarSize;
  /** Nom accessible de la photo. Omis → l'avatar est décoratif. */
  label?: string;
  /** Affiche la pastille appareil photo (purement visuelle : le geste est géré par l'appelant). */
  editable?: boolean;
  testID?: string;
};

export function Avatar({
  uri,
  size = "sm",
  label,
  editable = false,
  testID,
}: AvatarProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const d = DIAMETER[size];
  const box = { width: d, height: d, borderRadius: d / 2 };

  const face = uri ? (
    <Image
      source={{ uri }}
      accessibilityLabel={label}
      testID={testID}
      contentFit="cover"
      style={box}
    />
  ) : (
    <View
      testID={testID}
      style={box}
      className="items-center justify-center bg-surface-sunken"
    >
      <Icon name="paw" size={Math.round(d * 0.45)} decorative />
    </View>
  );

  if (!editable) return face;

  return (
    <View style={{ width: d, height: d }}>
      {face}
      <View
        testID={testID ? `${testID}-badge` : "avatar-badge"}
        className="absolute -bottom-1 -right-1 h-[30px] w-[30px] items-center justify-center rounded-full border-[3px] border-surface bg-text"
      >
        <Icon name="camera" size={14} color={colors.surface} decorative />
      </View>
    </View>
  );
}
