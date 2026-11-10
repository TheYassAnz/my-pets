import { View } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { Colors } from "@/constants/theme";

import { Icon, type IconName } from "./icon";

export type TypeIconType = "VACCINE" | "TREATMENT" | "VISIT" | "WEIGHT";

const ICON: Record<TypeIconType, IconName> = {
  VACCINE: "vaccine",
  TREATMENT: "treatment",
  VISIT: "visit",
  WEIGHT: "scale",
};

const BG: Record<TypeIconType, string> = {
  VACCINE: "bg-type-vaccine",
  TREATMENT: "bg-type-treatment",
  VISIT: "bg-type-visit",
  WEIGHT: "bg-type-weight",
};

const FG = {
  VACCINE: "typeVaccineFg",
  TREATMENT: "typeTreatmentFg",
  VISIT: "typeVisitFg",
  WEIGHT: "typeWeightFg",
} as const;

export type TypeIconProps = {
  type: TypeIconType;
  testID?: string;
};

export function TypeIcon({ type, testID }: TypeIconProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  return (
    <View
      testID={testID}
      className={`h-11 w-11 items-center justify-center rounded-full ${BG[type]}`}
    >
      <Icon
        name={ICON[type]}
        size={20}
        color={colors[FG[type]]}
        decorative
        testID={testID && `${testID}-icon`}
      />
    </View>
  );
}
