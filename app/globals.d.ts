// app/globals.d.ts
declare module '*.css' {
  const content: { [key: string]: string };
  export default content;
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// 如果用 Tailwind 或其他 CSS-in-JS，添加：
declare module '*.css?raw' {
  const content: string;
  export default content;
}
