'use client'; // 必需：启用客户端渲染（useState 等钩子）

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); // 清空旧消息
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
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px; padding: 12px 20px; border-radius: 4px; color: white; font-size: 14px; z-index: 1000;
      transform: translateX(100%); transition: transform 0.3s ease; max-width: 300px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    toast.textContent = msg;
    if (type === 'success') toast.style.background = '#27ae60';
    else toast.style.background = '#e74c3c';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 10);
    setTimeout(() => {
      toast.remove();
    }, 2000);
  };

  return (
    <div
      style={{
        margin: 0,
        padding: 20,
        background: '#f5f7fa',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          background: 'white',
          padding: 30,
          borderRadius: 8,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          maxWidth: 480,
          width: '100%',
        }}
      >
        <h1 style={{ textAlign: 'center', marginBottom: 20, color: '#2c3e50' }}>
          短网址生成器
        </h1>
        {message && (
          <div
            style={{
              padding: 10,
              marginBottom: 15,
              borderRadius: 4,
              textAlign: 'center',
              background: message.includes('成功') ? '#d4edda' : '#f8d7da',
              color: message.includes('成功') ? '#155724' : '#721c24',
            }}
          >
            {message}
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ marginBottom: 15 }}>
            <label
              htmlFor="url"
              style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}
            >
              长网址
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
              maxLength={2000}
              style={{
                width: '100%',
                padding: 10,
                border: '1px solid #ddd',
                borderRadius: 4,
                fontSize: 14,
              }}
            />
          </div>
          <div style={{ marginBottom: 15 }}>
            <label
              htmlFor="custom_code"
              style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}
            >
              自定义短码（可选）
            </label>
            <input
              type="text"
              id="custom_code"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              placeholder="myurl"
              maxLength={10}
              style={{
                width: '100%',
                padding: 10,
                border: '1px solid #ddd',
                borderRadius: 4,
                fontSize: 14,
              }}
            />
            <small
              style={{
                color: '#666',
                fontSize: 12,
                marginTop: 3,
                display: 'block',
              }}
            >
              小写字母数字，1-10位
            </small>
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              background: '#3498db',
              color: 'white',
              border: 'none',
              padding: 10,
              borderRadius: 4,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            生成短网址
          </button>
        </form>
        {shortUrl && (
          <div
            style={{
              marginTop: 15,
              padding: 15,
              background: '#f8f9fa',
              borderRadius: 4,
            }}
          >
            <strong>短网址</strong>
            <div>
              <a
                href={shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  wordBreak: 'break-all',
                  margin: '5px 0',
                  color: '#3498db',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                }}
              >
                点击跳转：{shortUrl}
              </a>
            </div>
            <button
              onClick={() => copyText(shortUrl)}
              style={{
                background: '#27ae60',
                marginTop: 8,
                padding: '6px 10px',
                fontSize: 12,
                width: 'auto',
                cursor: 'pointer',
                border: 'none',
                borderRadius: 4,
                color: 'white',
              }}
            >
              复制链接
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
