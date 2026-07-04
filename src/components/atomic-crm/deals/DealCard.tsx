import { Draggable } from "@hello-pangea/dnd";
import { useRedirect, RecordContextProvider } from "ra-core";
import { SelectField } from "@/components/admin/select-field";
import { Card, CardContent } from "@/components/ui/card";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal } from "../types";

export const DealCard = ({ deal, index }: { deal: Deal; index: number }) => {
  if (!deal) return null;

  return (
    <Draggable draggableId={String(deal.id)} index={index}>
      {(provided, snapshot) => (
        <DealCardContent provided={provided} snapshot={snapshot} deal={deal} />
      )}
    </Draggable>
  );
};

export const DealCardContent = ({
  provided,
  snapshot,
  deal,
}: {
  provided?: any;
  snapshot?: any;
  deal: Deal;
}) => {
  const { dealCategories } = useConfigurationContext();
  const redirect = useRedirect();
  const handleClick = () => {
    redirect(`/deals/${deal.id}/show`, undefined, undefined, undefined, {
      _scrollToTop: false,
    });
  };

  return (
    <div
      className="cursor-pointer"
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      ref={provided?.innerRef}
      onClick={handleClick}
    >
      <RecordContextProvider value={deal}>
        <Card
          className={`py-2.5 transition-all duration-150 ${
            snapshot?.isDragging ? "opacity-90 shadow-md" : "hover:border-input"
          }`}
        >
          <CardContent className="px-3 flex flex-col gap-1">
            <p className="text-[13px] font-medium">{deal.name}</p>
            <p className="text-xs text-muted-foreground">
              {deal.category && (
                <SelectField
                  source="category"
                  choices={dealCategories}
                  optionText="label"
                  optionValue="value"
                />
              )}
              {deal.expected_closing_date
                ? `${deal.category ? " · " : ""}${new Date(
                    deal.expected_closing_date,
                  ).toLocaleDateString()}`
                : ""}
            </p>
          </CardContent>
        </Card>
      </RecordContextProvider>
    </div>
  );
};
