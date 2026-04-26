import { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface InfoModalProps {
  trigger: ReactNode;
  title: string;
  content: string;
}

export function InfoModal({ trigger, title, content }: InfoModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold fire-text">{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
