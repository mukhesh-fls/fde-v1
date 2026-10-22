import type { Framing } from "../engine/framings";
import { AgentLoopControls, AgentLoopView } from "./models/agent-loop/View";
import { ApiCallControls, ApiCallView } from "./models/api-call/View";
import { ContextWindowControls, ContextWindowView } from "./models/context-window/View";
import { ContractControls, ContractView } from "./models/contract/View";
import { EmbeddingLookupControls, EmbeddingLookupView } from "./models/embedding-lookup/View";
import { FeedbackLoopsControls, FeedbackLoopsView } from "./models/feedback-loops/View";
import { LossLandscapeControls, LossLandscapeView } from "./models/loss-landscape/View";
import { NeuralNetControls, NeuralNetView } from "./models/neural-net/View";
import { NextTokenControls, NextTokenView } from "./models/next-token/View";
import { PromptStackControls, PromptStackView } from "./models/prompt-stack/View";
import { RoutingControls, RoutingView } from "./models/routing/View";
import { StockFlowControls, StockFlowView } from "./models/stock-flow/View";
import { SystemTypesControls, SystemTypesView } from "./models/system-types/View";

/** A 3D model the learner can explore: the scene, its controls, and where the camera starts. */
export type LabModelDef = { View: () => React.JSX.Element | null; Controls: () => React.JSX.Element; camera: Framing };

/**
 * Camera framings fit each model into the screen area between the top bar and the control dock at
 * 1440×900, filling about 90% of it. They were solved by projecting each model's extreme points.
 */
export const LAB_MODELS: Record<string, LabModelDef> = {
  "system-types": { View: SystemTypesView, Controls: SystemTypesControls, camera: { position: [3.4, 34.8, 39.3], target: [0.8, -2.5, 3.6] } },
  "agent-loop": { View: AgentLoopView, Controls: AgentLoopControls, camera: { position: [3.2, 32, 34.7], target: [0.8, -2, 2.1] } },
  "stock-flow": { View: StockFlowView, Controls: StockFlowControls, camera: { position: [2.1, 34.8, 33.5], target: [-0.2, 1.6, 1.6] } },
  "feedback-loops": { View: FeedbackLoopsView, Controls: FeedbackLoopsControls, camera: { position: [3, 44.5, 44.3], target: [0, 0.3, 2] } },
  "next-token": { View: NextTokenView, Controls: NextTokenControls, camera: { position: [6.4, 28.2, 76.9], target: [1.5, 5.6, -0.6] } },
  "neural-net": { View: NeuralNetView, Controls: NeuralNetControls, camera: { position: [0.5, 27.7, 31.7], target: [0.5, -0.2, 1.3] } },
  "loss-landscape": { View: LossLandscapeView, Controls: LossLandscapeControls, camera: { position: [20.9, 33.8, 41], target: [1.3, -0.9, 1.8] } },
  "api-call": { View: ApiCallView, Controls: ApiCallControls, camera: { position: [1.5, 27.5, 30.7], target: [-0.5, -0.2, 4] } },
  contract: { View: ContractView, Controls: ContractControls, camera: { position: [2.6, 27, 32.3], target: [0.7, -1.2, 5.3] } },
  routing: { View: RoutingView, Controls: RoutingControls, camera: { position: [2.6, 28.5, 28.7], target: [0.6, 0.6, 1.9] } },
  "prompt-stack": { View: PromptStackView, Controls: PromptStackControls, camera: { position: [2, 21.7, 21.3], target: [0.6, 1, 1.5] } },
  "context-window": { View: ContextWindowView, Controls: ContextWindowControls, camera: { position: [6.5, 35.5, 35.4], target: [4.1, 0.2, 1.6] } },
  "embedding-lookup": { View: EmbeddingLookupView, Controls: EmbeddingLookupControls, camera: { position: [4.8, 49.5, 51.9], target: [1.3, -1.2, 3.3] } },
};
