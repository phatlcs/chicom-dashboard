'use client'

export default function DashboardPage({ params }: { params: { slug: string } }) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `
          <!DOCTYPE html>
          <html lang="vi">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Boost · Community Insights Dashboard</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="/dashboard/styles.css">
          </head>
          <body>
            <div id="root"></div>
            <script src="https://unpkg.com/react@18.3.1/umd/react.development.js"></script>
            <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js"></script>
            <script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js"></script>
            <script>
              window.reportSlug = "${params.slug}";
            </script>
            <script src="/dashboard/pages/${params.slug}.js"></script>
            <script type="text/babel" src="/dashboard/shell.jsx"></script>
            <script type="text/babel" src="/dashboard/q1_q2.jsx"></script>
            <script type="text/babel" src="/dashboard/q3_q4.jsx"></script>
            <script type="text/babel" src="/dashboard/q5_q6.jsx"></script>
            <script type="text/babel" src="/dashboard/q7_q9.jsx"></script>
            <script type="text/babel" src="/dashboard/q10_q14.jsx"></script>
            <script type="text/babel" src="/dashboard/app.jsx"></script>
          </body>
          </html>
        `,
      }}
      style={{ width: '100%' }}
    />
  )
}
