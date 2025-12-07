import React from "react";
import {
  Box,
  Typography,
  Container,
  Paper,
  Divider,
} from "@mui/material";

const TermsOfServicePage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
        Terms of Service
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Last Updated: {new Date().toLocaleDateString()}
      </Typography>

      <Paper sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            1. Acceptance of Terms
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            By accessing or using TradingBot ("the Service"), you agree to be
            bound by these Terms of Service ("Terms"). If you disagree with any
            part of these terms, you may not access the Service.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            2. Description of Service
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            TradingBot provides an automated trading platform that allows users
            to create, test, and execute trading strategies. The Service includes
            backtesting tools, strategy management, broker integration, and
            portfolio monitoring features.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            3. User Accounts
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
            3.1 Account Creation
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            To use the Service, you must create an account and provide accurate,
            complete information. You are responsible for maintaining the
            confidentiality of your account credentials and for all activities
            that occur under your account.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
            3.2 Account Responsibility
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            You are solely responsible for all trading decisions and actions
            taken through your account. TradingBot is a tool that executes your
            strategies; we do not provide investment advice or guarantee trading
            results.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            4. Trading Risks and Disclaimers
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            <strong>IMPORTANT:</strong> Trading securities involves substantial
            risk of loss. You may lose some or all of your invested capital.
            Past performance does not guarantee future results.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            TradingBot does not:
          </Typography>
          <Typography variant="body1" component="div" sx={{ lineHeight: 1.8, mt: 2 }}>
            <ul style={{ paddingLeft: "20px" }}>
              <li>Provide investment, financial, or trading advice</li>
              <li>Guarantee profits or specific trading outcomes</li>
              <li>Assume responsibility for trading losses</li>
              <li>Ensure that strategies will perform as expected in live markets</li>
            </ul>
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, mt: 2 }}>
            You acknowledge that you understand the risks involved in trading and
            that you are solely responsible for your trading decisions and
            outcomes.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            5. Broker Integration
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            When you connect a broker account, you authorize TradingBot to
            access your account for the purpose of executing trades according to
            your configured strategies. You are responsible for:
          </Typography>
          <Typography variant="body1" component="div" sx={{ lineHeight: 1.8, mt: 2 }}>
            <ul style={{ paddingLeft: "20px" }}>
              <li>Maintaining accurate broker account information</li>
              <li>Ensuring sufficient account balance for trades</li>
              <li>Complying with your broker's terms of service</li>
              <li>Monitoring your account for unauthorized activity</li>
            </ul>
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            6. User Conduct
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            You agree not to:
          </Typography>
          <Typography variant="body1" component="div" sx={{ lineHeight: 1.8, mt: 2 }}>
            <ul style={{ paddingLeft: "20px" }}>
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use automated systems to abuse or overload the Service</li>
              <li>Share your account credentials with others</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Use the Service to manipulate markets or engage in fraudulent trading</li>
            </ul>
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            7. Intellectual Property
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            The Service, including its original content, features, and
            functionality, is owned by TradingBot and protected by international
            copyright, trademark, and other intellectual property laws. Your
            trading strategies and data remain your property.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            8. Subscription and Payment
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
            8.1 Subscription Plans
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            TradingBot offers various subscription plans. By subscribing, you
            agree to pay the applicable fees. Subscription fees are billed in
            advance on a monthly or annual basis.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
            8.2 Cancellation
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            You may cancel your subscription at any time. Cancellation takes
            effect at the end of your current billing period. No refunds are
            provided for partial billing periods.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            9. Service Availability
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            We strive to maintain high availability but do not guarantee
            uninterrupted access to the Service. The Service may be unavailable
            due to maintenance, technical issues, or circumstances beyond our
            control. We are not liable for any losses resulting from Service
            unavailability.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            10. Limitation of Liability
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, TRADINGBOT SHALL NOT BE
            LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
            PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER
            INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL,
            OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE SERVICE.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            11. Termination
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            We may terminate or suspend your account immediately, without prior
            notice, for conduct that we believe violates these Terms or is
            harmful to other users, us, or third parties. Upon termination, your
            right to use the Service will cease immediately.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            12. Changes to Terms
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            We reserve the right to modify these Terms at any time. We will
            notify users of material changes via email or through the Service.
            Your continued use of the Service after such changes constitutes
            acceptance of the modified Terms.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            13. Contact Information
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            For questions about these Terms, please contact us at:
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, mt: 2 }}>
            <strong>Email:</strong> legal@tradingbot.com
            <br />
            <strong>Support:</strong> support@tradingbot.com
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TermsOfServicePage;

