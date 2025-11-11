'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('Home');
  const tToast = useTranslations('Toast');

  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [message, setMessage] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(10); // 默认有效期 10 天

  const getExpiresValue = (value: string | number): number | null => {
    return value === 'permanent' ? null : Number(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      // 发送 null 表示永久
      const expiresValue = getExpiresValue(expiresInDays);
      const res = await fetch('/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          custom_code: customCode,
          expires_in_days: expiresValue,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setMessage(`${t('errorPrefix')}${data.error}`);
      } else {
        setShortUrl(data.shortUrl);
        setMessage(t('successMessage'));
      }
    } catch (err: any) {
      setMessage(`${t('errorPrefix')}${err.message}`);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => showToast(tToast('copied'), 'success'))
      .catch(() => showToast(tToast('copyFailed'), 'error'));
  };

  const showToast = (msg: string, type: string) => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-4 py-3 rounded-md text-white text-sm z-50 transform translate-x-full transition-transform shadow-lg ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-x-full'), 100);
    setTimeout(() => toast.remove(), 2000);
  };

  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-start justify-center p-4">
      <div className="container">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-8 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          {t('title')}
        </h1>

        {message && (
          <div
            className={`message ${
              message.includes(t('successMessage')) ? 'success' : 'error'
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-group">
            <label htmlFor="url">{t('longUrlLabel')}</label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t('longUrlPlaceholder')}
              required
              maxLength={2000}
              className="form-group input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="custom_code">{t('customCodeLabel')}</label>
            <input
              type="text"
              id="custom_code"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              placeholder={t('customCodePlaceholder')}
              maxLength={10}
              className="form-group input"
            />
            <small>{t('customCodeHint')}</small>
          </div>

          {/* 新增：有效期 select */}
          <div className="form-group">
            <label htmlFor="expires_in_days">{t('expiresLabel')}</label>
            <select
              id="expires_in_days"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              className="form-group input"
            >
              <option value="permanent">{t('permanent')}</option>
              {[1, 3, 7, 10].map((d) => (
                <option key={d} value={d}>
                  {t('days', { count: d })} {/* i18n: "1 天", "3 天" 等 */}
                </option>
              ))}
            </select>
            <small>{t('expiresHint')}</small>
          </div>

          <button type="submit" className="btn-primary">
            {t('generateButton')}
          </button>
        </form>

        {shortUrl && (
          <div className="result">
            <strong className="block text-lg font-semibold mb-2 text-gray-800">
              {t('yourShortUrl')}
            </strong>
            <a
              href={shortUrl}
              className="short-link block mb-3"
              target="_blank"
              rel="noopener noreferrer"
            >
              {shortUrl}
            </a>
            <button onClick={() => copyText(shortUrl)} className="btn-success">
              {t('copyButton')}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
