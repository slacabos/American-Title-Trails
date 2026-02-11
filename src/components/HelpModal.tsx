import React from "react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";
import { helpContent } from "../content/help";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>

        <div className="overflow-y-auto max-h-[calc(95vh-2rem)] px-6 pb-6">
          <div className="space-y-6 text-slate-100 pt-6">
            <MarkdownRenderer
              content={helpContent.en}
              className="prose prose-invert max-w-none"
            />

            <div className="flex justify-center pt-4">
              <Button
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700"
              >
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
