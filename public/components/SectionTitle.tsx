
import React from 'react';

interface SectionTitleProps {
  title: string;
  icon?: React.ReactNode;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title, icon }) => {
  return (
    <div className="flex items-center mb-6">
      {icon && <span className="mr-3 text-[#007bff] text-2xl">{icon}</span>}
      <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-[#007bff] pb-1">
        {title}
      </h2>
    </div>
  );
};

export default SectionTitle;
