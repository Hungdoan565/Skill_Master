import React from 'react';
import { PolicyLayout, PolicySection } from './components';
import { privacyPolicy } from './constants/policy-data';

export const BaoMatPage = () => {
  return (
    <PolicyLayout 
      title={privacyPolicy.title} 
      lastUpdated={privacyPolicy.lastUpdated}
      sections={privacyPolicy.sections}
    >
      <div className="mb-12 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl p-6">
        <p className="text-sm text-stone-600 dark:text-stone-300">
          <strong>Lưu ý pháp lý:</strong> Chính sách bảo mật này được xây dựng và tuân thủ theo 
          <span className="font-semibold text-zinc-950 dark:text-white"> Nghị định 13/2023/NĐ-CP </span> 
          về bảo vệ dữ liệu cá nhân tại Việt Nam. Bằng việc sử dụng dịch vụ của Skill Master, bạn xác nhận đã đọc và đồng ý với các điều khoản dưới đây.
        </p>
      </div>

      <div className="space-y-12">
        {privacyPolicy.sections.map((section) => (
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