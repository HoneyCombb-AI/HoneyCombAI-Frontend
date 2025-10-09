import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface Tag {
  id: string;
  name: string;
  color: string; // Hex color code (e.g. "#3B82F6")
}

interface ContactTagsProps {
  tags: Tag[];
}

export const ContactTags: React.FC<ContactTagsProps> = ({ tags }) => {
  if (!tags || tags.length === 0) {
    return <span className="text-sm text-gray-400">—</span>;
  }

  return (
    <div className="grid grid-cols-3 gap-3 w-fit">
      {tags.map((tag) => (
        <Tooltip key={tag.id} delayDuration={200}>
          <TooltipTrigger asChild>
            <div
              className="w-2.5 h-2.5 rounded-full cursor-pointer transition-transform hover:scale-110"
              style={{ backgroundColor: tag.color }}
            ></div>
          </TooltipTrigger>

          <TooltipContent
            className="text-sm px-3 py-2 bg-gray-900 text-white rounded-md border border-gray-700 max-w-xs"
          >
            {tag.name}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};
