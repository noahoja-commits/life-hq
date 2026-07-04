import { useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmState {
  open: boolean;
  message: string;
  onYes: () => void;
}

/**
 * Lightweight confirm dialog. Usage:
 *   const { confirm, confirmUI } = useConfirm();
 *   <button onClick={() => confirm("Delete this list?", doDelete)} />
 *   {confirmUI}
 */
export const useConfirm = () => {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    message: "",
    onYes: () => {},
  });

  const confirm = useCallback((message: string, onYes: () => void) => {
    setState({ open: true, message, onYes });
  }, []);

  const close = () => setState((s) => ({ ...s, open: false }));

  const confirmUI = (
    <Dialog open={state.open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{state.message}</p>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              state.onYes();
              close();
            }}
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return { confirm, confirmUI };
};
