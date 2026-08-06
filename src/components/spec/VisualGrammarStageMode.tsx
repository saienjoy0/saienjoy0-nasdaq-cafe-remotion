import {createContext, useContext, type ReactNode} from "react";
import type {VisualGrammarStageMode} from "../../spec/visual-grammar-stage-mode";

const VisualGrammarStageModeContext =
  createContext<VisualGrammarStageMode>("candidate");

export const VisualGrammarStageModeProvider: React.FC<{
  mode: VisualGrammarStageMode;
  children: ReactNode;
}> = ({mode, children}) => (
  <VisualGrammarStageModeContext.Provider value={mode}>
    {children}
  </VisualGrammarStageModeContext.Provider>
);

export const useVisualGrammarStageMode = () =>
  useContext(VisualGrammarStageModeContext);
