import { useTranslate } from "ra-core";
import { matchPath, useLocation } from "react-router";
import type { ReactNode } from "react";
import { CreateButton } from "@/components/admin/create-button";

import useAppBarHeight from "../misc/useAppBarHeight";
import { DealCreate } from "./DealCreate";

export const DealEmpty = ({ children }: { children?: ReactNode }) => {
  const translate = useTranslate();
  const location = useLocation();
  const matchCreate = matchPath("/deals/create", location.pathname);
  const appbarHeight = useAppBarHeight();

  return (
    <div
      className="flex flex-col justify-center items-center gap-12"
      style={{
        height: `calc(100dvh - ${appbarHeight}px)`,
      }}
    >
      <img
        src="./img/empty.svg"
        alt={translate("resources.deals.empty.title")}
      />
      <div className="flex flex-col items-center gap-0">
        <h3 className="text-lg font-bold">
          {translate("resources.deals.empty.title")}
        </h3>
        <p className="text-sm text-center text-muted-foreground mb-4">
          {translate("resources.deals.empty.description")}
        </p>
      </div>
      <div className="flex space-x-8">
        <CreateButton label="resources.deals.action.create" />
      </div>
      <DealCreate open={!!matchCreate} />
      {children}
    </div>
  );
};
