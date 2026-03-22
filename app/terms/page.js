import LegalPage from '../components/LegalPage';

export const metadata = { title: 'Freedly — Terms of Service' };

export default function TermsPage() {
  return (
    <LegalPage>
      <h1>Terms of service</h1>
      <p><strong>Last updated:</strong> March 2026</p>
      <p>These terms govern your use of Freedly (&ldquo;the service&rdquo;), operated through the website usefreedly.com. By creating an account or using the service, you agree to these terms.</p>

      <h2>The service</h2>
      <p>Freedly is a tool that helps you organise and browse your YouTube subscriptions. We access your YouTube data through the YouTube Data API with your explicit permission. Freedly is not affiliated with, endorsed by, or connected to YouTube or Google.</p>

      <h2>Your account</h2>
      <p>You must sign in with a valid Google account to use Freedly. You are responsible for maintaining the security of your account. You must be at least 13 years old to use the service.</p>
      <p>You agree to provide accurate information and to keep your account details current. You may not create accounts on behalf of others or use the service for any purpose that is unlawful or prohibited by these terms.</p>

      <h2>What you can do</h2>
      <p>With a Freedly account, you can:</p>
      <ul>
        <li>View and organise your YouTube subscriptions into categories and feeds</li>
        <li>Favourite channels, add notes, and customise your experience</li>
        <li>Upload your YouTube Takeout data for personal analytics</li>
        <li>Access the Discover feature to find new channels</li>
        <li>Use any features included in your plan (Free or Pro)</li>
      </ul>

      <h2>What you cannot do</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Attempt to access other users&rsquo; data or accounts</li>
        <li>Use the service to scrape, harvest, or collect data from YouTube beyond your own subscriptions</li>
        <li>Reverse engineer, decompile, or attempt to extract the source code of the service</li>
        <li>Use automated tools, bots, or scripts to interact with the service in a way that could harm its performance</li>
        <li>Resell, redistribute, or commercially exploit any part of the service without our written permission</li>
        <li>Use the service in any way that violates applicable laws or regulations</li>
      </ul>

      <h2>Free and paid plans</h2>
      <p>Freedly offers a free plan and a paid Pro plan. Features available on each plan may change over time. We will notify existing users before removing features from a plan they are currently using.</p>
      <p>Pro subscriptions are billed monthly. You can cancel at any time, and your Pro access will continue until the end of the current billing period. We do not offer refunds for partial months.</p>
      <p>We reserve the right to change pricing with 30 days notice to existing subscribers.</p>

      <h2>Your data</h2>
      <p>You retain ownership of your data. By using Freedly, you grant us a limited licence to store, process, and display your data solely for the purpose of providing the service. This licence ends when you delete your account.</p>
      <p>You can delete your account at any time through the settings page. When you delete your account, we will remove your personal data within 30 days, as described in our <a href="/privacy">privacy policy</a>.</p>
      <p>For full details on how we handle your data, see our <a href="/privacy">privacy policy</a>.</p>

      <h2>YouTube API compliance</h2>
      <p>Freedly uses the YouTube Data API. By using Freedly, you also agree to be bound by the YouTube Terms of Service (https://www.youtube.com/t/terms) and Google&rsquo;s Privacy Policy (https://policies.google.com/privacy).</p>
      <p>You can revoke Freedly&rsquo;s access to your YouTube data at any time through your Google account permissions page (https://myaccount.google.com/permissions).</p>

      <h2>Intellectual property</h2>
      <p>The Freedly name, logo, design, and original content are owned by us. You may not use our branding without written permission.</p>
      <p>Content from YouTube (channel names, video titles, thumbnails, statistics) is owned by the respective creators and YouTube. Freedly displays this content under the terms of the YouTube Data API and does not claim ownership of it.</p>

      <h2>Availability and changes</h2>
      <p>We aim to keep Freedly available and reliable, but we do not guarantee uninterrupted access. The service may be temporarily unavailable for maintenance, updates, or reasons beyond our control.</p>
      <p>We may modify, suspend, or discontinue any part of the service at any time. If we discontinue the service entirely, we will provide reasonable notice and an opportunity to export your data.</p>

      <h2>Limitation of liability</h2>
      <p>Freedly is provided &ldquo;as is&rdquo; without warranties of any kind, whether express or implied. To the maximum extent permitted by law:</p>
      <ul>
        <li>We are not liable for any indirect, incidental, or consequential damages arising from your use of the service</li>
        <li>Our total liability to you for any claims related to the service is limited to the amount you have paid us in the 12 months preceding the claim, or £50, whichever is greater</li>
        <li>We are not responsible for the accuracy, availability, or content of YouTube data displayed through the service</li>
      </ul>
      <p>Nothing in these terms excludes or limits our liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded under UK law.</p>

      <h2>Termination</h2>
      <p>We may suspend or terminate your account if you violate these terms or use the service in a way that could harm other users or the service itself. We will attempt to notify you before or at the time of termination unless doing so would be impractical or would compromise the security of other users.</p>
      <p>You may terminate your account at any time by deleting it through the settings page.</p>

      <h2>Disputes</h2>
      <p>These terms are governed by the laws of England and Wales. Any disputes arising from these terms or your use of the service will be subject to the exclusive jurisdiction of the courts of England and Wales.</p>

      <h2>Changes to these terms</h2>
      <p>We may update these terms from time to time. If we make material changes, we will notify you by email or through a notice on the website at least 14 days before the changes take effect. Continued use of the service after changes take effect constitutes acceptance of the updated terms.</p>

      <h2>Contact</h2>
      <p>If you have questions about these terms, contact us at hello@usefreedly.com.</p>
    </LegalPage>
  );
}
