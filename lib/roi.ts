/** Monthly economics of an automation from the visitor's own inputs. Pure, so it is tested. */
export type RoiInput = { volume: number; minutes: number; rate: number; review: number; tools: number };

export function roi({ volume, minutes, rate, review, tools }: RoiInput) {
  const manualHours = (volume * minutes) / 60;
  const residualHours = manualHours * (review / 100);
  const manualMonth = manualHours * rate;
  const autoMonth = residualHours * rate + tools;
  return {
    hoursMonth: manualHours - residualHours,
    manualMonth,
    autoMonth,
    netMonth: manualMonth - autoMonth,
  };
}
