import {AbsoluteFill} from "remotion";
import type {PublicMainContent} from "../spec/public-view-model";
import {CardFirstFinancialRenderer} from "../components/spec/CardFirstFinancialRenderer";
import {VisualGrammarStageHost} from "../components/spec/VisualGrammarStageHost";
import {VisualGrammarStageModeProvider} from "../components/spec/VisualGrammarStageMode";
import {fontFamily} from "../fonts";

export const CardFirstContractStill: React.FC<{content: PublicMainContent}> = ({content}) => (
  <VisualGrammarStageModeProvider mode="candidate">
    <AbsoluteFill style={{background: "#07111F", fontFamily}}>
      <div style={{position: "absolute", left: 416, top: 144, width: 1440, height: 648, overflow: "hidden"}}>
        <VisualGrammarStageHost visualTemplate={content.visualTemplate} variant={content.templateConfig.variant}>
          <CardFirstFinancialRenderer content={content}/>
        </VisualGrammarStageHost>
      </div>
      <div style={{position: "absolute", left: 416, top: 84, color: "#D5E3EE", fontSize: 26, fontWeight: 850}}>Synthetic current-contract visual fixture</div>
    </AbsoluteFill>
  </VisualGrammarStageModeProvider>
);
