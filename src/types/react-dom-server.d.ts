declare module "react-dom/server" {
  import type {ReactNode} from "react";

  export const renderToStaticMarkup: (node: ReactNode) => string;
}
