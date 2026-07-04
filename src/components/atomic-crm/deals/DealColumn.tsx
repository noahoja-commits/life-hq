import { Droppable } from "@hello-pangea/dnd";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal } from "../types";
import { findDealLabel } from "./dealUtils";
import { DealCard } from "./DealCard";

export const DealColumn = ({
  stage,
  deals,
}: {
  stage: string;
  deals: Deal[];
}) => {
  const { dealStages } = useConfigurationContext();
  return (
    <div className="flex-1 pb-8">
      <div className="flex items-baseline gap-1.5 px-1">
        <h3 className="u-label text-muted-foreground">
          {findDealLabel(dealStages, stage)}
        </h3>
        <span className="text-xs font-medium text-muted-foreground/60">
          {deals.length}
        </span>
      </div>
      <Droppable droppableId={stage}>
        {(droppableProvided, snapshot) => (
          <div
            ref={droppableProvided.innerRef}
            {...droppableProvided.droppableProps}
            className={`flex flex-col rounded-lg mt-2 gap-1.5 ${
              snapshot.isDraggingOver ? "bg-accent/60" : ""
            }`}
          >
            {deals.map((deal, index) => (
              <DealCard key={deal.id} deal={deal} index={index} />
            ))}
            {droppableProvided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
