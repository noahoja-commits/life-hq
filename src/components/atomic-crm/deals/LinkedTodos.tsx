import { useRecordContext } from "ra-core";
import { NextActions } from "../todos/NextActions";
import type { Deal } from "../types";

/** "Next actions" panel on a Project — thin record-context adapter. */
export const LinkedTodos = () => {
  const record = useRecordContext<Deal>();
  if (!record) return null;
  return (
    <div className="m-4">
      <NextActions filterField="project_id" refId={Number(record.id)} />
    </div>
  );
};
