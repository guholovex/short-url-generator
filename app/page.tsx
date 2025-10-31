'use client';
import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    // Toast 逻辑（同 PHP JS）
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  return (
    <div className="container">
      <h1>短网址生成器</h1>
      {message && (
        <div
          className={`message ${
            message.includes('成功') ? 'success' : 'error'
          }`}
        >
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit}>
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
          />
          <small>小写字母数字，1-10位</small>
        </div>
        <button type="submit">生成短网址</button>
      </form>
      {shortUrl && (
        <div className="result">
          <strong>短网址</strong>
          <a
            href={shortUrl}
            className="short-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            点击跳转：{shortUrl}
          </a>
          <button className="copy-btn" onClick={() => copyText(shortUrl)}>
            复制链接
          </button>
        </div>
      )}
    </div>
  );
}
