import React, { useState, useEffect } from 'react';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { Button, buttonVariants } from '../../../../components/ui/button';
import { Download, Loader2, Eye } from 'lucide-react';
import { ClassicGoldTemplate } from './ClassicGoldTemplate';
import { ModernBlueTemplate } from './ModernBlueTemplate';
import { ProfessionalPurpleTemplate } from './ProfessionalPurpleTemplate';
import { ElegantWarmTemplate } from './ElegantWarmTemplate';
import { generateQRDataURL, getVerificationURL } from '../../utils/pdf-utils';
import { CATEGORY_CONFIG } from '../../constants';
import { cn } from '../../../../lib/utils';

// Internal function to get the actual React-PDF component based on category or template string
const getTemplateComponent = (categoryOrTemplate) => {
  // Try to match template name directly first
  switch (categoryOrTemplate) {
    case 'classic-gold': return ClassicGoldTemplate;
    case 'modern-blue': return ModernBlueTemplate;
    case 'professional-purple': return ProfessionalPurpleTemplate;
    case 'elegant-warm': return ElegantWarmTemplate;
    default: break; // Fallback to category check
  }

  // Otherwise, lookup by category
  const templateName = CATEGORY_CONFIG[categoryOrTemplate]?.template || 'classic-gold';
  switch (templateName) {
    case 'modern-blue': return ModernBlueTemplate;
    case 'professional-purple': return ProfessionalPurpleTemplate;
    case 'elegant-warm': return ElegantWarmTemplate;
    case 'classic-gold':
    default:
      return ClassicGoldTemplate;
  }
};

/**
 * Base template renderer that resolves the correct template and handles QR generation
 */
export const CertificateDocument = ({ certificate, certificateType, centerInfo, options }) => {
  const TemplateComponent = getTemplateComponent(certificateType?.category);

  return (
    <TemplateComponent 
      certificate={certificate}
      certificateType={certificateType}
      centerInfo={centerInfo}
      options={options}
      qrDataUrl={options?.qrDataUrl}
    />
  );
};

/**
 * Hook to pre-generate QR code before rendering PDF
 */
const useQRCode = (certificate, enabled = true) => {
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const generateQR = async () => {
      if (!enabled || !certificate?.certificate_number) {
        if (isMounted) setQrDataUrl(null);
        return;
      }
      
      const url = getVerificationURL(certificate.certificate_number);
      const dataUrl = await generateQRDataURL(url, { width: 150 });
      
      if (isMounted) {
        setQrDataUrl(dataUrl);
      }
    };
    
    generateQR();
    
    return () => { isMounted = false; };
  }, [certificate, enabled]);

  return qrDataUrl;
};

/**
 * Component to preview the certificate in an iframe
 */
export const PDFPreview = ({ certificate, certificateType, centerInfo, options = {}, className = "w-full h-[600px]" }) => {
  const showQR = options.showQR !== false;
  const qrDataUrl = useQRCode(certificate, showQR);

  // If QR code is enabled but not loaded yet, show loading state
  if (showQR && !qrDataUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-md ${className}`}>
        <div className="flex flex-col items-center text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <p>Generating preview...</p>
        </div>
      </div>
    );
  }

  const enhancedOptions = { ...options, qrDataUrl };

  return (
    <PDFViewer className={`border rounded-md ${className}`} showToolbar={true}>
      <CertificateDocument 
        certificate={certificate}
        certificateType={certificateType}
        centerInfo={centerInfo}
        options={enhancedOptions}
      />
    </PDFViewer>
  );
};

/**
 * Button component to trigger PDF download
 */
export const PDFDownloadButton = ({ 
  certificate, 
  certificateType, 
  centerInfo, 
  options = {}, 
  variant = "default",
  size = "default",
  className = "",
  children
}) => {
  const showQR = options.showQR !== false;
  const qrDataUrl = useQRCode(certificate, showQR);
  const fileName = `${certificate?.certificate_number || 'certificate'}.pdf`;

  // Wait for QR code before showing download link to ensure it's in the PDF
  if (showQR && !qrDataUrl) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        {children || "Preparing PDF..."}
      </Button>
    );
  }

  const enhancedOptions = { ...options, qrDataUrl };

  return (
    <PDFDownloadLink
      document={
        <CertificateDocument 
          certificate={certificate}
          certificateType={certificateType}
          centerInfo={centerInfo}
          options={enhancedOptions}
        />
      }
      fileName={fileName}
      className={cn(buttonVariants({ variant, size, className }), "inline-flex items-center justify-center")}
    >
      {({ blob, url, loading, error }) => {
        if (loading) {
          return (
            <React.Fragment>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </React.Fragment>
          );
        }
        
        return (
          <React.Fragment>
            <Download className="w-4 h-4 mr-2" />
            {children || "Download PDF"}
          </React.Fragment>
        );
      }}
    </PDFDownloadLink>
  );
};

// Export the base factory function for programmatic usage
export const TemplateRenderer = CertificateDocument;
