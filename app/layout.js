export const metadata = {
  title: "TQ TEST",
  description: "스터디포스 TQ 독해 역량 분석",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
