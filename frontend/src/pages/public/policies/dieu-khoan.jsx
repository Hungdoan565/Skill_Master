import React from 'react';
import { PolicyLayout, PolicySection } from './components';
import { termsOfService } from './constants/policy-data';

export const DieuKhoanPage = () => {
  return (
    <PolicyLayout 
      title={termsOfService.title} 
      lastUpdated={termsOfService.lastUpdated}
      sections={termsOfService.sections}
    >
      <div className="space-y-12">
        {termsOfService.sections.map((section) => (
          <PolicySection 
            key={section.id}
            id={section.id}
            heading={section.heading}
            content={section.content}
            table={section.table}
          />
        ))}
      </div>
    </PolicyLayout>
  );
};