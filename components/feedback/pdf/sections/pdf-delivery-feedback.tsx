import { View, Text, StyleSheet } from "@react-pdf/renderer"
import { colors, fonts, fontSize } from "../theme"
import type { DeliveryObservation } from "@/lib/sessions"

const CATEGORY_LABELS: Record<DeliveryObservation["category"], string> = {
  pace: "Pace",
  fillers: "Fillers",
  volume: "Volume",
  pauses: "Pauses",
  pitch: "Pitch",
  phrasing: "Phrasing",
}

const SEVERITY_COLORS: Record<DeliveryObservation["severity"], { border: string; bg: string; label: string }> = {
  positive: { border: colors.exceptional, bg: colors.exceptionalBg, label: colors.exceptional },
  neutral:  { border: colors.proficient,  bg: colors.proficientBg,  label: colors.proficient },
  concern:  { border: colors.developing,  bg: colors.developingBg,  label: colors.developing },
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: fonts.sans,
    fontSize: fontSize.xs,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: colors.textMuted,
    marginBottom: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  card: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
  },
  categoryLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.xs,
    fontWeight: 600,
    marginBottom: 3,
  },
  observation: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    lineHeight: 1.5,
    color: colors.text,
  },
})

interface PdfDeliveryFeedbackProps {
  observations: DeliveryObservation[]
}

export function PdfDeliveryFeedback({ observations }: PdfDeliveryFeedbackProps) {
  return (
    <View>
      <Text style={styles.heading}>Speech &amp; Delivery</Text>
      <View style={styles.grid}>
        {observations.map((obs, i) => {
          const sev = SEVERITY_COLORS[obs.severity]
          return (
            <View
              key={i}
              style={[styles.card, { borderColor: sev.border, backgroundColor: sev.bg }]}
              wrap={false}
            >
              <Text style={[styles.categoryLabel, { color: sev.label }]}>
                {CATEGORY_LABELS[obs.category]}
              </Text>
              <Text style={styles.observation}>{obs.observation}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
