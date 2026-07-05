import { useNotify, useDelete, useUpdate, useCreate } from "ra-core";
import { useCallback, useRef } from "react";

/**
 * Hook that wraps create/update/delete operations with an undo toast.
 * After a destructive action (delete or update), shows a toast with "Undo" button.
 * If the user clicks Undo within 5 seconds, the action is reversed.
 *
 * Usage:
 *   const { deleteWithUndo } = useUndoable();
 *   deleteWithUndo("todos", { id: 5, previousData: todo });
 */
export const useUndoable = () => {
  const notify = useNotify();
  const [remove] = useDelete();
  const [update] = useUpdate();
  const [create] = useCreate();
  const undoRef = useRef<(() => void) | null>(null);

  const clearUndo = useCallback(() => {
    undoRef.current = null;
  }, []);

  /**
   * Delete a record with undo support.
   * The record is deleted immediately. If undo is clicked within 5s, it's recreated.
   */
  const deleteWithUndo = useCallback(
    (resource: string, params: { id: number; previousData: any }) => {
      remove(resource, {
        id: params.id,
        previousData: params.previousData,
      });

      const undo = () => {
        create(resource, {
          data: { ...params.previousData, id: undefined },
        });
        notify("Restored", { type: "success" });
      };
      undoRef.current = undo;

      notify(`Deleted. Undo?`, {
        type: "info",
        undo: undo,
        autoHideDuration: 5000,
      });
    },
    [remove, create, notify],
  );

  /**
   * Update a record with undo support.
   */
  const updateWithUndo = useCallback(
    (
      resource: string,
      params: { id: number; data: any; previousData: any },
    ) => {
      update(resource, {
        id: params.id,
        data: params.data,
        previousData: params.previousData,
      });

      const undo = () => {
        update(resource, {
          id: params.id,
          data: params.previousData,
          previousData: params.data,
        });
        notify("Reverted", { type: "success" });
      };
      undoRef.current = undo;

      notify(`Updated. Undo?`, {
        type: "info",
        undo: undo,
        autoHideDuration: 5000,
      });
    },
    [update, notify],
  );

  return { deleteWithUndo, updateWithUndo, clearUndo };
};
