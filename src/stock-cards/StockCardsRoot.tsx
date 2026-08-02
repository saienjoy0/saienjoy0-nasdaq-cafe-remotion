import React from "react";
import {Still} from "remotion";
import {StockPopupCard, StockPopupCardProps} from "./StockPopupCard";

export const StockCardsRoot: React.FC = () => {
  return (
    <Still
      id="StockPopupCard"
      component={StockPopupCard}
      width={1536}
      height={864}
      defaultProps={
        {
          companyName: "NVIDIA",
          ticker: "NVDA",
          description: "AI向けGPUを設計",
          logoFile: "assets/nasdaq-cafe/logos/nvda.svg",
          brandColor: "#76B900",
        } satisfies StockPopupCardProps
      }
    />
  );
};
