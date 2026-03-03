import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { PolicyLayout } from './components';
import { faqItems, faqCategories } from './constants/policy-data';
import { ConsultationModal } from '@/components/common';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Helmet } from 'react-helmet-async';

// Create a local Accordion instead of missing shadcn one to strictly avoid missing module errors
// We are mimicking shadcn/ui API locally for this page
const Accordion = ({ type, collapsible, className, children }) => {
  const [openItem, setOpenItem] = useState(null);

  const toggleItem = (value) => {
    if (type === 'single' && collapsible) {
      setOpenItem(openItem === value ? null : value);
    }
  };

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {React.Children.map(children, child => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child, {
          isOpen: openItem === child.props.value,
          onToggle: () => toggleItem(child.props.value)
        });
      })}
    </div>
  );
};

const AccordionItem = ({ value, className, children, isOpen, onToggle }) => {
  return (
    <div className={`border border-stone-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 ${className || ''}`}>
      {React.Children.map(children, child => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child, { isOpen, onToggle });
      })}
    </div>
  );
};

const AccordionTrigger = ({ className, children, isOpen, onToggle }) => {
  return (
    <button
      className={`flex flex-1 items-center justify-between py-4 px-6 w-full font-medium transition-all hover:bg-stone-50 dark:hover:bg-zinc-900 ${className || ''} ${isOpen ? 'text-red-600 dark:text-red-500' : 'text-zinc-900 dark:text-zinc-100'}`}
      onClick={onToggle}
    >
      {children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>
  );
};

const AccordionContent = ({ className, children, isOpen }) => {
  if (!isOpen) return null;
  
  return (
    <div className={`overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down ${className || ''}`}>
      <div className="pb-4 pt-0 px-6 text-stone-600 dark:text-stone-300">
        {children}
      </div>
    </div>
  );
};

const removeAccents = (str) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
};

export const FaqPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);

  const filteredItems = useMemo(() => {
    return faqItems.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const normalizedSearch = removeAccents(searchQuery);
      const normalizedQuestion = removeAccents(item.question);
      const normalizedAnswer = removeAccents(item.answer);
      const matchesSearch = normalizedQuestion.includes(normalizedSearch) || normalizedAnswer.includes(normalizedSearch);
      
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  // Generate JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <PolicyLayout 
      title="Câu Hỏi Thường Gặp (FAQ)" 
      lastUpdated="01/01/2025"
      sections={[
        { id: 'search', heading: 'Tìm kiếm câu hỏi' },
        { id: 'faq-list', heading: 'Danh sách câu hỏi' },
        { id: 'contact', heading: 'Hỗ trợ thêm' }
      ]}
    >
      {/* Search and Filter */}
      <div id="search" className="scroll-mt-28 space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Tìm kiếm câu hỏi hoặc từ khóa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all text-zinc-900 dark:text-white"
          />
        </div>

        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="w-full h-auto flex flex-wrap justify-start gap-2 bg-transparent">
            {faqCategories.map((cat) => (
              <TabsTrigger 
                key={cat.value} 
                value={cat.value}
                className="rounded-full px-6 py-2.5 data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=inactive]:bg-stone-100 dark:data-[state=inactive]:bg-zinc-900 data-[state=inactive]:text-stone-600 dark:data-[state=inactive]:text-stone-300"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* FAQ List */}
      <div id="faq-list" className="scroll-mt-28">
        {filteredItems.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {filteredItems.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-16 px-4 bg-stone-50 dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800 text-stone-500 dark:text-stone-400">
            <Search className="h-12 w-12 mx-auto mb-4 text-stone-300 dark:text-zinc-700" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">Không tìm thấy câu hỏi phù hợp</h3>
            <p className="mb-6">Vui lòng thử lại với từ khóa khác hoặc liên hệ trực tiếp với chúng tôi.</p>
            <button 
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="px-6 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg text-sm font-medium hover:bg-stone-50 dark:hover:bg-zinc-700 transition-colors text-zinc-900 dark:text-white"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Contact CTA */}
      <div id="contact" className="scroll-mt-28 mt-16 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-8 text-center">
        <h3 className="text-xl font-bold text-zinc-950 dark:text-white mb-4">
          Không tìm thấy câu trả lời?
        </h3>
        <p className="text-stone-600 dark:text-stone-300 mb-6 max-w-lg mx-auto">
          Đội ngũ tư vấn của Skill Master luôn sẵn sàng hỗ trợ bạn giải đáp mọi thắc mắc về khóa học và lộ trình.
        </p>
        <button
          onClick={() => setIsConsultationModalOpen(true)}
          className="inline-flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors shadow-sm"
        >
          Hỏi Molly — AI Tư vấn
        </button>
      </div>

      <ConsultationModal 
        isOpen={isConsultationModalOpen} 
        onClose={() => setIsConsultationModalOpen(false)} 
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>
    </PolicyLayout>
  );
};