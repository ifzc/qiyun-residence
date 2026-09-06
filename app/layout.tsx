import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: '栖云府 · 中国古代府邸 3D 漫游',
  description: '转动视角，走近一座中式府邸。探索三进院落、灰瓦厅堂、木作回廊与池畔园林。',
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
