import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Loads the welcome email HTML template and replaces placeholders with actual values
 */
export function getWelcomeEmailHTML(options: {
  logoUrl?: string;
  restaurantsUrl?: string;
  appUrl?: string;
  unsubscribeUrl?: string;
}): string {
  const templatePath = path.join(process.cwd(), "templates", "emails", "welcome-email.html");
  
  if (!fs.existsSync(templatePath)) {
    // Fallback to inline template if file doesn't exist
    return getFallbackWelcomeEmailHTML(options);
  }

  let html = fs.readFileSync(templatePath, "utf-8");

  // Replace placeholders
  const replacements: Record<string, string> = {
    "{{LOGO_URL}}": options.logoUrl || `${options.appUrl || "http://localhost:3000"}/logo.png`,
    "{{RESTAURANTS_URL}}": options.restaurantsUrl || `${options.appUrl || "http://localhost:3000"}/restaurants`,
    "{{APP_URL}}": options.appUrl || "http://localhost:3000",
    "{{UNSUBSCRIBE_URL}}": options.unsubscribeUrl || `${options.appUrl || "http://localhost:3000"}/unsubscribe`,
    "{{YEAR}}": new Date().getFullYear().toString(),
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    html = html.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), value);
  }

  return html;
}

/**
 * Fallback inline template if file doesn't exist
 */
function getFallbackWelcomeEmailHTML(options: {
  logoUrl?: string;
  restaurantsUrl?: string;
  appUrl?: string;
  unsubscribeUrl?: string;
}): string {
  const logoUrl = options.logoUrl || `${options.appUrl || "http://localhost:3000"}/logo.png`;
  const restaurantsUrl = options.restaurantsUrl || `${options.appUrl || "http://localhost:3000"}/restaurants`;
  const appUrl = options.appUrl || "http://localhost:3000";
  const unsubscribeUrl = options.unsubscribeUrl || `${appUrl}/unsubscribe`;
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .email-container {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #F9F7F2;
      padding: 40px 20px;
    }
    .card {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    }
    .content {
      padding: 40px;
      text-align: center;
    }
    .logo {
      width: 180px;
      margin-bottom: 30px;
    }
    .title {
      color: #1A1A1B;
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.5px;
      margin-bottom: 15px;
    }
    .body-text {
      color: #555555;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(145deg, #8C6239 0%, #634628 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 12px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 14px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 12px;
      color: #999999;
    }
    .footer a {
      color: #999999;
      text-decoration: underline;
    }
    .sankofa-quote {
      margin-top: 40px;
      border-top: 1px solid #F0F0F0;
      padding-top: 20px;
      font-style: italic;
      color: #8C6239;
      font-size: 14px;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }
      .title {
        font-size: 24px;
      }
      .body-text {
        font-size: 14px;
      }
      .cta-button {
        padding: 14px 30px;
        font-size: 12px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="card">
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td width="33.3%" height="6" bgcolor="#A33B32"></td>
          <td width="33.3%" height="6" bgcolor="#2E7D32"></td>
          <td width="33.4%" height="6" bgcolor="#C69C2B"></td>
        </tr>
      </table>

      <div class="content">
        <img src="${logoUrl}" alt="AfriTable" class="logo">
        
        <h1 class="title">Welcome to the Table</h1>
        
        <p class="body-text">
          Thank you for joining <strong>AfriTable</strong>. You've just unlocked a world of authentic flavors, from the smoky grills of Lagos to the vibrant spices of Kingston. 
          <br><br>
          We are more than a reservation app—we are a community dedicated to honoring the heritage of African and Caribbean culinary excellence.
        </p>
        
        <a href="${restaurantsUrl}" class="cta-button">Find Your First Table</a>
        
        <div class="sankofa-quote">
          <p style="margin: 0;">
            "Se wo were fi na wosankofa a yenkyi."
          </p>
        </div>
      </div>
    </div>
    
    <div class="footer">
      &copy; ${year} AfriTable. All rights reserved. <br>
      You are receiving this because you signed up at ${appUrl} <br>
      <a href="${unsubscribeUrl}">Unsubscribe</a>
    </div>
  </div>
</body>
</html>`;
}
