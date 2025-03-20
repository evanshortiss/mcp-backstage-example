import { Level, pino } from "pino";

export default function getLogger (level: Level) {
  return pino({ level })
}