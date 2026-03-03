import React from 'react';
import { PolicyLayout, PolicySection } from './components';
import { 
  refundPolicy, 
  preservationPolicy, 
  transferPolicy, 
  paymentPolicy, 
  commitmentPolicy 
} from './constants/policy-data';

export const ChinhSachPage = () => {
  // Combine all sections for the TableOfContents
  // We'll create a single flat list of sections, but grouped by Policy
  const allSections = [
    { id: 'refund', heading: 'I. ' + refundPolicy.title },
    ...refundPolicy.sections,
    { id: 'preservation', heading: 'II. ' + preservationPolicy.title },
    ...preservationPolicy.sections,
    { id: 'transfer', heading: 'III. ' + transferPolicy.title },
    ...transferPolicy.sections,
    { id: 'payment', heading: 'IV. ' + paymentPolicy.title },
    ...paymentPolicy.sections,
    { id: 'commitment', heading: 'V. ' + commitmentPolicy.title },
    ...commitmentPolicy.sections
  ];

  return (
    <PolicyLayout 
      title="Chính Sách Trung Tâm" 
      lastUpdated={refundPolicy.lastUpdated}
      sections={allSections}
    >
      <div className="space-y-16">
        {/* I. Chính Sách Hoàn Phí */}
        <div id="refund" className="scroll-mt-28">
          <h2 className="text-3xl font-extrabold text-red-600 mb-8 border-b-2 border-stone-100 dark:border-zinc-800 pb-4">
            I. {refundPolicy.title}
          </h2>
          <div className="space-y-12">
            {refundPolicy.sections.map((section) => (
              <PolicySection 
                key={section.id}
                id={section.id}
                heading={section.heading}
                content={section.content}
                table={section.table}
              />
            ))}
          </div>
        </div>

        {/* II. Chính Sách Bảo Lưu */}
        <div id="preservation" className="scroll-mt-28">
          <h2 className="text-3xl font-extrabold text-red-600 mb-8 border-b-2 border-stone-100 dark:border-zinc-800 pb-4">
            II. {preservationPolicy.title}
          </h2>
          <div className="space-y-12">
            {preservationPolicy.sections.map((section) => (
              <PolicySection 
                key={section.id}
                id={section.id}
                heading={section.heading}
                content={section.content}
                table={section.table}
              />
            ))}
          </div>
        </div>

        {/* III. Chính Sách Chuyển Nhượng */}
        <div id="transfer" className="scroll-mt-28">
          <h2 className="text-3xl font-extrabold text-red-600 mb-8 border-b-2 border-stone-100 dark:border-zinc-800 pb-4">
            III. {transferPolicy.title}
          </h2>
          <div className="space-y-12">
            {transferPolicy.sections.map((section) => (
              <PolicySection 
                key={section.id}
                id={section.id}
                heading={section.heading}
                content={section.content}
                table={section.table}
              />
            ))}
          </div>
        </div>

        {/* IV. Chính Sách Thanh Toán */}
        <div id="payment" className="scroll-mt-28">
          <h2 className="text-3xl font-extrabold text-red-600 mb-8 border-b-2 border-stone-100 dark:border-zinc-800 pb-4">
            IV. {paymentPolicy.title}
          </h2>
          <div className="space-y-12">
            {paymentPolicy.sections.map((section) => (
              <PolicySection 
                key={section.id}
                id={section.id}
                heading={section.heading}
                content={section.content}
                table={section.table}
              />
            ))}
          </div>
        </div>

        {/* V. Cam Kết Chất Lượng */}
        <div id="commitment" className="scroll-mt-28">
          <h2 className="text-3xl font-extrabold text-red-600 mb-8 border-b-2 border-stone-100 dark:border-zinc-800 pb-4">
            V. {commitmentPolicy.title}
          </h2>
          <div className="space-y-12">
            {commitmentPolicy.sections.map((section) => (
              <PolicySection 
                key={section.id}
                id={section.id}
                heading={section.heading}
                content={section.content}
                table={section.table}
              />
            ))}
          </div>
        </div>
      </div>
    </PolicyLayout>
  );
};