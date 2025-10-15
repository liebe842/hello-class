'use client';

import LayoutWrapper from './LayoutWrapper';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutWrapper>{children}</LayoutWrapper>;
}
