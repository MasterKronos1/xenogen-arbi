import { NextRequest, NextResponse } from "next/server"
import { runAgent } from "@/lib/agents/runner"
import { PipelineResult } from "@/lib/agents/types"

export async function POST(req: NextRequest) {
  try {
    const { task } = await req.json()

    if (!task || typeof task !== "string") {
      return NextResponse.json(
        { error: "task is required and must be a string" },
        { status: 400 }
      )
    }

    const outputs: Record<string, string> = {}

    const analystResult = await runAgent("analyst", { task })
    if (analystResult.error) throw new Error(`Analyst: ${analystResult.error}`)
    outputs.analyst = analystResult.output

    const navigatorResult = await runAgent("navigator", {
      task,
      previousOutputs: outputs,
    })
    if (navigatorResult.error) throw new Error(`Navigator: ${navigatorResult.error}`)
    outputs.navigator = navigatorResult.output

    const synthesizerResult = await runAgent("synthesizer", {
      task,
      previousOutputs: outputs,
    })
    if (synthesizerResult.error) throw new Error(`Synthesizer: ${synthesizerResult.error}`)
    outputs.synthesizer = synthesizerResult.output

    const result: PipelineResult = {
      task,
      outputs,
      final: synthesizerResult.output,
    }

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pipeline error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
