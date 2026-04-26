import { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface InfoModalProps {
  trigger: ReactNode;
  title: string;
  content: ReactNode;
}

export function InfoModal({ trigger, title, content }: InfoModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px] bg-card border-border text-foreground max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold fire-text">{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 text-sm leading-relaxed text-foreground">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
