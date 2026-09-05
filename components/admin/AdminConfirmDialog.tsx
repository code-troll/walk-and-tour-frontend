"use client";

import {useState} from "react";
import {LoaderCircle} from "lucide-react";

import {Button} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import type {ReactNode} from "react";

/**
 * Confirming something that cannot be undone.
 *
 * `confirmPhrase` is the difference between "are you sure" and actually being
 * sure. A dialog with two buttons is dismissed by muscle memory; typing the
 * hotel's name is a sentence you cannot produce by accident, and it makes you
 * read which hotel you are on. It is reserved for the operations that reach
 * outside this database — deleting an identity in the provider is not something
 * a later click can take back.
 *
 * Without a phrase this is an ordinary confirmation, which is right for the
 * reversible ones.
 */
export function AdminConfirmDialog({
  confirmLabel,
  confirmPhrase,
  description,
  isPending = false,
  onConfirm,
  onOpenChange,
  open,
  title,
}: {
  confirmLabel: string;
  /** When set, the confirm button stays disabled until this is typed exactly. */
  confirmPhrase?: string;
  description: ReactNode;
  isPending?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
}) {
  // The caller mounts this only while it is asking, so the field starts empty
  // on its own. Holding the value across closings and clearing it in an effect
  // would leave the phrase typed for one hotel sitting there, already valid,
  // for the next one — and React objects to that shape for exactly this reason.
  const [typed, setTyped] = useState("");

  const isConfirmable = !confirmPhrase || typed.trim() === confirmPhrase;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {confirmPhrase ? (
          <div>
            <Label htmlFor="confirm-phrase">
              Type <span className="font-medium text-[var(--wt-ink)]">{confirmPhrase}</span> to
              confirm
            </Label>
            <Input
              autoComplete="off"
              id="confirm-phrase"
              onChange={(event) => setTyped(event.target.value)}
              value={typed}
            />
          </div>
        ) : null}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button
            disabled={!isConfirmable || isPending}
            onClick={onConfirm}
            variant="destructive"
          >
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
