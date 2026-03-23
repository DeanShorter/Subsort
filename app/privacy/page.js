import LegalPage from '../components/LegalPage';

export const metadata = { title: 'Subscrub — Privacy Policy' };

export default function PrivacyPage() {
  return (
    <LegalPage>
      <h1>Privacy policy</h1>
      <p><strong>Last updated:</strong> March 2026</p>
      <p>Subscrub (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) operates the website getsubscrub.com. This policy explains what data we collect, why we collect it, how we use it, and your rights regarding that data.</p>

      <h2>What we collect</h2>
      <p><strong>Account information.</strong> When you sign up, we receive your name, email address, and profile picture from your Google account via Google OAuth. We do not receive or store your Google password.</p>
      <p><strong>YouTube subscription data.</strong> With your permission, we access your YouTube subscription list through the YouTube Data API. This allows us to display and organise your subscribed channels within Subscrub. We store your subscription data in our database to provide the service.</p>
      <p><strong>Usage data.</strong> We collect information about how you use Subscrub, including which features you use, your category preferences, channel favourites, notes you create, and general interaction patterns. This helps us improve the product.</p>
      <p><strong>Google Takeout data.</strong> If you choose to upload your YouTube Takeout data for watch analytics, we process this data to generate insights about your viewing habits. This data is stored securely and is only accessible to you.</p>
      <p><strong>Technical data.</strong> We automatically collect standard technical information such as your browser type, device type, and general location (country level). We do not track your precise location.</p>

      <h2>How we use your data</h2>
      <p>We use your data to:</p>
      <ul>
        <li>Provide the Subscrub service, including organising your subscriptions and delivering personalised feeds</li>
        <li>Improve and develop new features based on aggregate usage patterns</li>
        <li>Send you service-related communications (account confirmations, important updates)</li>
        <li>Send you our newsletter, if you have opted in</li>
        <li>Detect and prevent abuse of the service</li>
      </ul>
      <p>We do not sell your data to third parties. We do not use your data for advertising. We do not share your individual data with other users unless you explicitly choose to make something public.</p>

      <h2>Third-party services</h2>
      <p>We use the following third-party services to operate Subscrub:</p>
      <ul>
        <li><strong>Google OAuth and YouTube Data API</strong> — for authentication and accessing your subscription data, governed by Google&rsquo;s privacy policy</li>
        <li><strong>Supabase</strong> — for database hosting and authentication infrastructure</li>
        <li><strong>Vercel</strong> — for website hosting</li>
        <li><strong>Resend</strong> — for sending transactional and newsletter emails</li>
      </ul>
      <p>Each of these services has their own privacy policy governing how they handle data.</p>

      <h2>Google API Services disclosure</h2>
      <p>Subscrub&rsquo;s use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements. We only use YouTube API data to provide the features described in this policy and do not use it for any other purpose.</p>

      <h2>Data storage and security</h2>
      <p>Your data is stored on servers operated by Supabase (hosted on AWS infrastructure). We use encryption in transit (HTTPS/TLS) for all data transmitted between your browser and our servers. Database access is restricted to authenticated requests only.</p>

      <h2>Data retention</h2>
      <p>We retain your data for as long as your account is active. If you delete your account, we delete your personal data within 30 days. Anonymised, aggregate data (such as total user counts) may be retained indefinitely.</p>

      <h2>Your rights</h2>
      <p>Under UK GDPR and the Data Protection Act 2018, you have the right to:</p>
      <ul>
        <li><strong>Access</strong> your personal data — you can request a copy of the data we hold about you</li>
        <li><strong>Rectify</strong> inaccurate data — you can ask us to correct any errors</li>
        <li><strong>Delete</strong> your data — you can request that we delete your account and associated data</li>
        <li><strong>Port</strong> your data — you can request your data in a machine-readable format</li>
        <li><strong>Withdraw consent</strong> — you can revoke access to your YouTube data at any time through your Google account settings</li>
        <li><strong>Object</strong> to processing — you can object to us processing your data for certain purposes</li>
        <li><strong>Unsubscribe</strong> from our newsletter at any time using the link in any email we send</li>
      </ul>
      <p>To exercise any of these rights, contact us at hello@getsubscrub.com.</p>

      <h2>Cookies</h2>
      <p>Subscrub uses essential cookies required for the service to function (authentication session cookies). We do not use tracking cookies or third-party advertising cookies.</p>

      <h2>Children</h2>
      <p>Subscrub is not intended for use by anyone under the age of 13. We do not knowingly collect data from children.</p>

      <h2>Changes to this policy</h2>
      <p>We may update this policy from time to time. If we make significant changes, we will notify you by email or through a notice on the website. Continued use of Subscrub after changes constitutes acceptance of the updated policy.</p>

      <h2>Contact</h2>
      <p>If you have questions about this privacy policy or your data, contact us at hello@getsubscrub.com.</p>
    </LegalPage>
  );
}
