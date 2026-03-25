import React from "react";
import { tw } from "../../../lib/utils";

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div {...props} className={tw(className)}>
    {children}
  </div>
);