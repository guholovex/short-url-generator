'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, custom_code: customCode }),
      });
      const data = await res.json();
      if (data.error) {
        setMessage(`错误: ${data.error}`);
      } else {
        setShortUrl(data.shortUrl);
        setMessage('生成成功！');
      }
    } catch (err: any) {
      setMessage(`错误: ${err.message}`);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => showToast('已复制！', 'success'))
      .catch(() => showToast('复制失败', 'error'));
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
          短网址生成器
        </h1>

        {message && (
          <div
            className={`message ${
              message.includes('成功') ? 'success' : 'error'
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-group">
            <label htmlFor="url">长网址</label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
              maxLength={2000}
              className="form-group input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="custom_code">自定义短码（可选）</label>
            <input
              type="text"
              id="custom_code"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              placeholder="myurl"
              maxLength={10}
              className="form-group input"
            />
            <small>小写字母数字，1-10位</small>
          </div>

          <button type="submit" className="btn-primary">
            生成短网址
          </button>
        </form>

        {shortUrl && (
          <div className="result">
            <strong className="block text-lg font-semibold mb-2 text-gray-800">
              你的短网址
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
              复制链接
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
