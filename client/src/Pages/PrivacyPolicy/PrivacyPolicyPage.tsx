import React from "react";
import {
  Box,
  Typography,
  Container,
  Paper,
  Divider,
} from "@mui/material";

const PrivacyPolicyPage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
        Privacy Policy
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Last Updated: {new Date().toLocaleDateString()}
      </Typography>

      <Paper sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            1. Introduction
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            TradingBot ("we," "our," or "us") is committed to protecting your
            privacy. This Privacy Policy explains how we collect, use, disclose,
            and safeguard your information when you use our automated trading
            platform and services.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            2. Information We Collect
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
            2.1 Account Information
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            When you create an account, we collect information such as your
            username, email address, and password. We may also collect optional
            information like your name and phone number for account verification
            purposes.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
            2.2 Trading Data
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            We collect information about your trading strategies, backtest
            results, trading sessions, and portfolio performance. This data is
            essential for providing our core services.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
            2.3 Broker Integration Data
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            When you connect your broker account (e.g., Alpaca), we securely
            store your API credentials. We do not store your broker account
            passwords. All API communications are encrypted and handled
            according to industry best practices.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
            2.4 Usage Data
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            We automatically collect information about how you interact with our
            platform, including pages visited, features used, and time spent on
            the platform. This helps us improve our services.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            3. How We Use Your Information
          </Typography>
          <Typography variant="body1" component="div" sx={{ lineHeight: 1.8 }}>
            <ul style={{ paddingLeft: "20px" }}>
              <li>To provide, maintain, and improve our services</li>
              <li>To process transactions and manage your account</li>
              <li>To execute your trading strategies as configured</li>
              <li>To send you important updates and notifications</li>
              <li>To respond to your inquiries and provide customer support</li>
              <li>To detect, prevent, and address technical issues and security threats</li>
              <li>To comply with legal obligations and enforce our terms</li>
            </ul>
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            4. Data Security
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            We implement industry-standard security measures to protect your
            information, including encryption, secure API connections, and
            regular security audits. However, no method of transmission over the
            internet is 100% secure, and we cannot guarantee absolute security.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Your broker API credentials are encrypted at rest and transmitted
            securely. We never share your broker credentials with third parties.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            5. Data Sharing and Disclosure
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            We do not sell your personal information. We may share your
            information only in the following circumstances:
          </Typography>
          <Typography variant="body1" component="div" sx={{ lineHeight: 1.8, mt: 2 }}>
            <ul style={{ paddingLeft: "20px" }}>
              <li>With your broker when executing trades on your behalf</li>
              <li>With service providers who assist in operating our platform (under strict confidentiality agreements)</li>
              <li>When required by law or to protect our rights and safety</li>
              <li>In connection with a business transfer or merger (with notice to users)</li>
            </ul>
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            6. Your Rights
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            You have the right to:
          </Typography>
          <Typography variant="body1" component="div" sx={{ lineHeight: 1.8, mt: 2 }}>
            <ul style={{ paddingLeft: "20px" }}>
              <li>Access and review your personal information</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your trading data</li>
            </ul>
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, mt: 2 }}>
            To exercise these rights, please contact us at support@tradingbot.com
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            7. Cookies and Tracking
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            We use cookies and similar tracking technologies to enhance your
            experience, analyze usage patterns, and improve our services. You can
            control cookie preferences through your browser settings.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            8. Children's Privacy
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Our services are not intended for individuals under the age of 18.
            We do not knowingly collect personal information from children. If you
            believe we have collected information from a child, please contact us
            immediately.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            9. Changes to This Policy
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            We may update this Privacy Policy from time to time. We will notify
            you of any material changes by posting the new policy on this page
            and updating the "Last Updated" date. Your continued use of our
            services after such changes constitutes acceptance of the updated
            policy.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            10. Contact Us
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            If you have questions or concerns about this Privacy Policy or our
            data practices, please contact us at:
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, mt: 2 }}>
            <strong>Email:</strong> privacy@tradingbot.com
            <br />
            <strong>Support:</strong> support@tradingbot.com
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default PrivacyPolicyPage;

