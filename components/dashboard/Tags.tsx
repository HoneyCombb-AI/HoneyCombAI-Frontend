import React from 'react';

export interface Tag {
  id: string;
  name: string;
  color: string; // Hex color code (e.g., "#3B82F6") or any valid CSS color
}

interface ContactTagsProps {
  tags: Tag[];
}

export const ContactTags: React.FC<ContactTagsProps> = ({ tags }) => {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-3 gap-2 w-fit">
      {tags.map((tag) => (
        <div key={tag.id} className="relative group">
          <div
            className="w-2 h-2 rounded-full cursor-pointer"
            style={{ backgroundColor: tag.color }}
          ></div>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            {tag.name}
          </div>
        </div>
      ))}
    </div>
  );
};
