import { useState } from 'react';
import { X as XIcon, Copy, Check, Loader2, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function ShareGameModal({ onClose, shareCode, shareUrl }) {
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(shareCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-green-600" />
            Share Game
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center gap-5">
          {/* QR Code */}
          <div className="bg-white p-4 rounded-xl border-2 border-gray-100">
            <QRCodeSVG
              value={shareUrl}
              size={200}
              level="M"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#1a1a1a"
            />
          </div>

          <p className="text-sm text-gray-500 text-center">
            Scan to join this game
          </p>

          {/* Share Code */}
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-500 mb-1.5 text-center">Game Code</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.3em] text-gray-800 select-all">
                {shareCode}
              </div>
              <button
                onClick={copyCode}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                title="Copy code"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Share URL */}
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-500 mb-1.5 text-center">Share Link</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-600 truncate select-all">
                {shareUrl}
              </div>
              <button
                onClick={copyUrl}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                title="Copy link"
              >
                {copiedUrl ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
