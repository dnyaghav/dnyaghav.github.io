<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.google.com/schemas/sitemap/0.84">

  <xsl:output method="html" indent="yes"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <title>Sitemap Index - dnyaghav.github.io</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"/>
      </head>
      <body class="bg-light">
        <div class="container py-5">
          <h1 class="fw-bold mb-4">🌐 Sitemap Index</h1>
          <p class="text-muted">List of sitemap sections for <strong>dnyaghav.github.io</strong></p>

          <div class="card shadow-sm">
            <ul class="list-group list-group-flush">
              <xsl:for-each select="//s:sitemap">
                <li class="list-group-item">
                  <a href="{s:loc}" class="text-decoration-none">
                    <xsl:value-of select="s:loc"/>
                  </a>
                </li>
              </xsl:for-each>
            </ul>
          </div>

          <footer class="text-center text-muted mt-4 small">
            © 2025 dnyaghav.github.io • Styled Sitemap Index
          </footer>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
