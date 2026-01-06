/**
 * CertificateQRCode - QR Code component for certificate verification
 * Extracted from PublicCertificateVerification
 */

import { QRCodeSVG } from 'qrcode.react';

export function CertificateQRCode({ certificateNumber, size = 120 }) {
    const verifyUrl = `${window.location.origin}/verify-certificate?cert=${certificateNumber}`;

    return (
        <div className="flex flex-col items-center">
            <div className="p-3 bg-white rounded-xl shadow-md border-2 border-slate-100">
                <QRCodeSVG
                    value={verifyUrl}
                    size={size}
                    level="H"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#1e293b"
                />
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
                Quét để xác thực
            </p>
        </div>
    );
}

export default CertificateQRCode;
