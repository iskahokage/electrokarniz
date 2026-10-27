import type { Ecosystem } from "@/content/types";

// Порядок экосистем в таблицах: от самого простого (пульт) к умному дому.
export const ecoOrder: Ecosystem[] = ["remote", "switch", "tuya", "alice", "mihome", "zigbee", "google", "homekit"];
