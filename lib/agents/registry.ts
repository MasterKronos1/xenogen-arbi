// /lib/agents/registry.ts

import { analystConfig } from "@/config/agents/analyst.v1"
import { navigatorConfig } from "@/config/agents/navigator.v1"
import { synthesizerConfig } from "@/config/agents/synthesizer.v1"

export const agentRegistry = {
  analyst: analystConfig,
  navigator: navigatorConfig,
  synthesizer: synthesizerConfig,
}
