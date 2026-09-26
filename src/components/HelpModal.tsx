import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import MarkdownRenderer from "./MarkdownRenderer";
import ShortcutList from "./hud/ShortcutList";
import { helpContent } from "../content/help";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] p-0 overflow-hidden rounded-2xl">
        <DialogTitle className="sr-only">How to play</DialogTitle>
        <div className="overflow-y-auto max-h-[92vh] px-6 sm:px-8 pb-6">
          <div className="space-y-6 text-card-foreground pt-6">
            <ShortcutList />
            <MarkdownRenderer content={helpContent.en} className="max-w-none" />

            <div className="flex justify-center pt-4">
              <Button onClick={onClose} size="lg">
                Got it!
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpModal;
